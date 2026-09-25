/**
 * Escáner de grupos de WhatsApp — Agenda Cultural Loja
 *
 * Lee los mensajes del grupo por API (SOLO LECTURA), detecta los que
 * contienen enlaces, visita esos enlaces y guarda lo encontrado como
 * post pendiente de moderación.
 *
 * NO escribe en el grupo, NO reacciona, NO marca como leído.
 *
 * La tabla `wa_mensajes_procesados` evita volver a procesar el mismo
 * mensaje en cada pasada (idempotencia).
 */

const {
  buscarMensajes,
  extraerTextoDeMensaje,
  esMensajeRelevante,
} = require("./evolution-client");
const {
  extractAndProcessUrls,
  extractFromTextOnly,
  extractFromImage,
  extractUrls,
} = require("./url-extractor");

/** Evita que dos pasadas se solapen si una tarda más de lo previsto. */
let escaneando = false;

/** Lee la lista de grupos a escanear desde la variable de entorno. */
function gruposConfigurados() {
  return (process.env.GRUPOS_SCRAPING || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function yaProcesado(prisma, mensajeId) {
  const filas = await prisma.$queryRaw`
    SELECT id FROM wa_mensajes_procesados WHERE id = ${mensajeId} LIMIT 1
  `;
  return Array.isArray(filas) && filas.length > 0;
}

async function marcarProcesado(prisma, mensajeId, grupoId, datos) {
  await prisma.$executeRaw`
    INSERT IGNORE INTO wa_mensajes_procesados
      (id, grupoId, messageTimestamp, urlsEncontradas, postsCreados)
    VALUES
      (${mensajeId}, ${grupoId}, ${datos.timestamp ?? null},
       ${datos.urls ?? 0}, ${datos.posts ?? 0})
  `;
}

/**
 * Escanea un grupo.
 *
 * @param {object} prisma
 * @param {string} jid - grupo (termina en @g.us)
 * @param {object} opciones
 * @param {number} opciones.paginas - cuántas páginas recorrer (1 = 50 mensajes)
 * @param {number} opciones.offset - mensajes por página
 * @param {boolean} opciones.verbose
 */
async function escanearGrupo(prisma, jid, opciones = {}) {
  const { paginas = 1, offset = 50, verbose = true } = opciones;

  const resumen = {
    jid,
    mensajesRevisados: 0,
    mensajesNuevos: 0,
    mensajesConUrl: 0,
    // Mensajes con adjunto (afiche) que quedan para cuando exista la descarga
    // de media: no se marcan como procesados, así no se "queman".
    mensajesEnEspera: 0,
    postsCreados: 0,
    errores: [],
  };

  for (let page = 1; page <= paginas; page++) {
    let data;
    try {
      data = await buscarMensajes(jid, page, offset);
    } catch (err) {
      resumen.errores.push(`página ${page}: ${err.message}`);
      break;
    }

    const registros = data.registros || [];
    if (registros.length === 0) break;

    // La API devuelve del más reciente al más antiguo; procesamos del
    // más antiguo al más nuevo para que los posts queden en orden.
    for (const msg of [...registros].reverse()) {
      resumen.mensajesRevisados++;

      const mensajeId = msg?.key?.id;
      if (!mensajeId) continue;
      if (!esMensajeRelevante(msg)) continue;

      try {
        if (await yaProcesado(prisma, mensajeId)) continue;
      } catch (err) {
        resumen.errores.push(`dedupe ${mensajeId}: ${err.message}`);
        continue;
      }

      resumen.mensajesNuevos++;

      const texto = extraerTextoDeMensaje(msg);
      const urls = texto ? extractUrls(texto) : [];

      // ¿Trae un adjunto que todavía no sabemos leer? (afiche, PDF, audio, video)
      // `documentWithCaptionMessage` es el PDF/imagen CON texto, que llega
      // anidado y es justo el caso más probable de la descarga de media.
      const contenido = msg.message || {};
      const tieneAdjunto = Boolean(
        contenido.imageMessage ||
          contenido.videoMessage ||
          contenido.audioMessage ||
          contenido.documentMessage ||
          contenido.documentWithCaptionMessage
      );

      let posts = [];
      if (urls.length > 0) {
        resumen.mensajesConUrl++;
        if (verbose) {
          console.log(
            `[Scanner] Mensaje de ${msg.pushName || "?"} con ${urls.length} URL(s)`
          );
        }
        try {
          posts = await extractAndProcessUrls(texto, jid, prisma);
        } catch (err) {
          resumen.errores.push(`extracción ${mensajeId}: ${err.message}`);
        }
      } else if (contenido.imageMessage) {
        // Afiche suelto: la imagen es la fuente del evento. Si no se puede leer
        // (Evolution caído, Gemini saturado) `extractFromImage` lanza, y aquí se
        // deja el mensaje SIN marcar para reintentarlo en el próximo escaneo.
        try {
          const post = await extractFromImage(msg, texto, jid, prisma);
          posts = post ? [post] : [];
        } catch (err) {
          resumen.errores.push(`afiche ${mensajeId}: ${err.message}`);
          resumen.mensajesEnEspera++;
          continue;
        }
      } else if (texto && texto.trim().length > 10) {
        // Sin enlace pero con texto propio: puede describir el evento entero.
        try {
          const post = await extractFromTextOnly(texto, jid, prisma);
          posts = post ? [post] : [];
        } catch (err) {
          resumen.errores.push(`texto ${mensajeId}: ${err.message}`);
        }
      }

      resumen.postsCreados += posts.length;

      // PDF, audio o video sin enlace: la tubería para leerlos todavía no existe,
      // así que se dejan SIN marcar como procesados. No se queman.
      if (urls.length === 0 && tieneAdjunto && !contenido.imageMessage) {
        resumen.mensajesEnEspera++;
        continue;
      }

      try {
        await marcarProcesado(prisma, mensajeId, jid, {
          timestamp: msg.messageTimestamp,
          urls: urls.length,
          posts: posts.length,
        });
      } catch (err) {
        resumen.errores.push(`marcar ${mensajeId}: ${err.message}`);
      }
    }
  }

  return resumen;
}

/** Escanea todos los grupos configurados en GRUPOS_SCRAPING. */
async function escanearTodo(prisma, opciones = {}) {
  if (escaneando) {
    return { omitido: true, motivo: "Ya hay un escaneo en curso" };
  }

  const grupos = gruposConfigurados();
  if (grupos.length === 0) {
    return {
      omitido: true,
      motivo: "GRUPOS_SCRAPING está vacío: no hay grupos configurados",
    };
  }

  escaneando = true;
  const inicio = Date.now();
  const resultados = [];

  try {
    for (const jid of grupos) {
      console.log(`[Scanner] Escaneando ${jid}...`);
      const resumen = await escanearGrupo(prisma, jid, opciones);
      resultados.push(resumen);

      console.log(
        `[Scanner] ${jid}: ${resumen.mensajesNuevos} nuevos, ` +
          `${resumen.mensajesConUrl} con enlaces, ${resumen.postsCreados} posts`
      );

      if (resumen.errores.length) {
        for (const e of resumen.errores) {
          console.error(`[Scanner]   error: ${e}`);
        }
      }
    }
  } finally {
    escaneando = false;
  }

  return {
    omitido: false,
    duracionMs: Date.now() - inicio,
    grupos: resultados,
    totalPostsCreados: resultados.reduce((a, r) => a + r.postsCreados, 0),
  };
}

module.exports = {
  gruposConfigurados,
  escanearGrupo,
  escanearTodo,
  yaProcesado,
  marcarProcesado,
};
