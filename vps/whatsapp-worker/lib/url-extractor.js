/**
 * Extracción de datos de eventos — Worker de WhatsApp
 *
 * PRINCIPIO RECTOR: "no inventarse nada".
 *   Cada campo extraído guarda de qué fuente salió (`fuentes`). Los campos
 *   que no se pudieron leer quedan en `null` y se listan en `camposFaltantes`.
 *   El moderador ve exactamente qué es dato real y qué falta.
 *
 * ORDEN DE PRIORIDAD:
 *   1. JSON-LD schema.org/Event → dato estructurado publicado por el
 *      organizador. Es la fuente más confiable (fecha, lugar, imagen exactos).
 *   2. Texto del mensaje de WhatsApp → el organizador suele escribir
 *      "Sábado 4 de octubre, 19h00, Teatro Bolívar" en el propio mensaje.
 *   3. OpenGraph / Twitter Card → sirve bien para título, descripción e imagen,
 *      pero casi nunca trae la fecha ni el lugar reales del evento.
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const { fechaDesdeIso, extraerRangoDeTexto } = require("./fechas-es");
const { rehospedarImagen, configurado: bunnyConfigurado } = require("./imagenes");

// ─── Extracción de URLs desde texto ───────────────────────────────────────

/**
 * Extrae todas las URLs de un texto.
 * @param {string} text
 * @returns {string[]}
 */
function extractUrls(text) {
  if (!text || typeof text !== "string") return [];

  const urlPattern = /(https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+)/gi;
  const matches = text.match(urlPattern);
  if (!matches) return [];

  const vistos = new Set();
  const resultado = [];

  for (const match of matches) {
    const url = match.startsWith("www.") ? `https://${match}` : match;
    // Quitar puntuación final que suele quedar pegada: "...evento." / "...evento,"
    const limpia = url.replace(/[.,;:!?]+$/, "");

    try {
      const parsed = new URL(limpia);
      if (!/^https?:$/.test(parsed.protocol)) continue;
      if (vistos.has(limpia)) continue;
      vistos.add(limpia);
      resultado.push(limpia);
    } catch {
      // URL inválida, se descarta
    }
  }

  return resultado;
}

// ─── Utilidades de limpieza ───────────────────────────────────────────────

/** Quita el sufijo de marca típico de los <title>: "Evento | NombreDelSitio". */
function limpiarTitulo(t) {
  if (!t || typeof t !== "string") return null;
  let s = t.replace(/\s+/g, " ").trim();
  if (!s) return null;

  const partes = s.split(/\s+[|\u2013\u2014]\s+|\s+-\s+/);
  if (partes.length > 1 && partes[0].trim().length >= 12) {
    s = partes[0].trim();
  }
  return s.slice(0, 255) || null;
}

// Títulos que NO aportan nada: son el nombre de la red social o una
// pantalla de login/consentimiento, no el nombre del evento.
const TITULO_GENERICO =
  /^(?:facebook|instagram|youtube|tiktok|twitter|\bx\b|threads|log\s?in|sign\s?in|iniciar\s+sesi[óo]n|watch|video|reel|post|story|before\s+you\s+continue.*|just\s+a\s+moment.*|attention\s+required.*|content\s+not\s+available.*|p[aá]gina\s+no\s+disponible.*|error|redirecting.*|untitled)$/i;

function esTituloGenerico(t) {
  if (!t) return true;
  return TITULO_GENERICO.test(t.trim());
}

/**
 * Saca un título de la primera línea útil del mensaje de WhatsApp.
 * Se usa cuando el enlace no da un título real (caso típico de Facebook).
 */
function tituloDesdeCaption(texto) {
  if (!texto || typeof texto !== "string") return null;

  const lineas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const linea of lineas) {
    const sinUrls = linea.replace(/https?:\/\/\S+/g, " ");
    const sinHashtags = sinUrls.replace(/#[\p{L}\p{N}_]+/gu, " ");
    // Quitar emojis y signos del principio
    const limpio = sinHashtags
      .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\s|•·.,;:()\[\]{}<>"'«»-]+/u, "")
      .replace(/\s+/g, " ")
      .trim();

    if (limpio.length >= 10) return limpio.slice(0, 255);
  }

  return null;
}

// Palabras que indican que NO es un lugar real.
// Evita basura del tipo "en el año 2024" o "en esta ocasión".
const LUGAR_INVALIDO =
  /^(?:el|la|los|las|un|una|este|esta|ese|esa|su|mi|nuestro|nuestra|todo|toda|todos|todas|general|varios|diversos|este\s+a[ñn]o|el\s+a[ñn]o|la\s+ciudad|esta\s+ocasi[óo]n|el\s+mes|la\s+fecha|el\s+marco|el\s+contexto|caso|sign\s?in|sign|log\s?in|iniciar\s+sesi[óo]n|facebook|instagram|youtube|tiktok|twitter|whatsapp|cookies|privacidad|privacy|ver\s+m[aá]s|see\s+more|loading|cargando)\b/i;

/** Normaliza y valida un candidato a lugar. Devuelve null si no es creíble. */
function limpiarLugar(v) {
  if (!v || typeof v !== "string") return null;

  let s = v.replace(/\s+/g, " ").trim();
  s = s.replace(/^[\s:,-]+/, "").replace(/[\s.,;:]+$/, "").trim();

  if (s.length < 4) return null;
  if (LUGAR_INVALIDO.test(s)) return null;
  if (/^\d+$/.test(s)) return null;
  // Horas sueltas: "19h00", "19:00"
  if (/^\d{1,2}\s*(?:h|:)\s*\d{2}$/i.test(s)) return null;
  // Fechas sueltas: "4 de octubre"
  if (/^\d{1,2}\s+de\s+\w+$/i.test(s)) return null;
  // URLs pegadas
  if (/^https?:\/\//i.test(s)) return null;

  return s.slice(0, 255);
}

/**
 * Busca el lugar en el texto libre del mensaje.
 * Prioriza etiquetas explícitas ("Lugar: X") antes que prosa.
 */
function extraerLugarDeTexto(texto) {
  if (!texto || typeof texto !== "string") return null;

  // 1. Etiqueta explícita o marcador con emoji de ubicación (📍).
  //    Los posts del grupo suelen escribir "📍 Iglesia Catedral", así que
  //    reconocer el emoji es esencial.
  //    OJO: no incluir "teatro"/"auditorio" aquí; son nombres de lugares,
  //    no etiquetas. Si se incluyen, "en el Teatro Bolívar" daría "Bolívar".
  const etiquetado =
    /(?:📍|\b(?:lugar|ubicaci[óo]n|sede|direcci[óo]n|d[óo]nde|local|venue)\s*:?)\s*([^\n\r|]{3,90})/i.exec(
      texto
    );
  if (etiquetado) {
    const limpio = limpiarLugar(etiquetado[1]);
    if (limpio) return limpio;
  }

  // 2. "en el Teatro Bolívar" / "en la Casa de la Cultura"
  //    Exige mayúscula inicial → descarta "en el año", "en esta ocasión".
  const enNombrePropio =
    /\ben\s+(?:el|la|los|las)?\s*([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ'’.-]*(?:\s+(?:de|del|la|las|los|y|San|Santa)?\s*[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ'’.-]*){0,4})/.exec(
      texto
    );
  if (enNombrePropio) {
    const limpio = limpiarLugar(enNombrePropio[1]);
    if (limpio) return limpio;
  }

  return null;
}

/** Elige la mejor descripción disponible entre el caption y los meta tags. */
function mejorDescripcion(caption, og, meta) {
  const norm = (v) =>
    typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";

  const c = { valor: norm(caption), fuente: "caption" };
  const o = { valor: norm(og), fuente: "og" };
  const m = { valor: norm(meta), fuente: "meta" };

  // La descripción escrita por el organizador suele ser la más específica.
  if (c.valor.length >= 80) return c;

  const candidatos = [c, o, m].filter((x) => x.valor.length >= 40);
  if (candidatos.length > 0) {
    return candidatos.reduce((a, b) => (b.valor.length > a.valor.length ? b : a));
  }

  return [c, o, m].find((x) => x.valor.length > 0) || null;
}

/** Normaliza el campo `image` de JSON-LD (string | string[] | {url} | [{url}]). */
function normalizarImagen(img) {
  if (!img) return null;
  if (typeof img === "string") return img.trim() || null;

  if (Array.isArray(img)) {
    for (const item of img) {
      const r = normalizarImagen(item);
      if (r) return r;
    }
    return null;
  }

  if (typeof img === "object") {
    if (typeof img.url === "string") return img.url.trim() || null;
    if (typeof img.contentUrl === "string") return img.contentUrl.trim() || null;
  }

  return null;
}

/** Normaliza el campo `location` de JSON-LD a texto plano. */
function normalizarLugar(location) {
  if (!location) return null;

  if (typeof location === "string") return limpiarLugar(location);

  if (Array.isArray(location)) {
    for (const item of location) {
      const r = normalizarLugar(item);
      if (r) return r;
    }
    return null;
  }

  if (typeof location === "object") {
    if (typeof location.name === "string") {
      const limpio = limpiarLugar(location.name);
      if (limpio) return limpio;
    }

    const addr = location.address;
    if (typeof addr === "string") return limpiarLugar(addr);

    if (addr && typeof addr === "object") {
      const partes = [
        location.name,
        addr.streetAddress,
        addr.addressLocality,
        addr.addressRegion,
      ].filter((p) => typeof p === "string" && p.trim());

      if (partes.length > 0) {
        return limpiarLugar(partes.slice(0, 2).join(", "));
      }
    }
  }

  return null;
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────

/** Aplana un nodo JSON-LD (soporta @graph y arrays anidados). */
function aplanarJsonLd(nodo, salida = []) {
  if (!nodo) return salida;

  if (Array.isArray(nodo)) {
    for (const item of nodo) aplanarJsonLd(item, salida);
    return salida;
  }

  if (typeof nodo !== "object") return salida;

  salida.push(nodo);
  if (nodo["@graph"]) aplanarJsonLd(nodo["@graph"], salida);

  return salida;
}

/** ¿El @type corresponde a un evento? Cubre Event, MusicEvent, TheaterEvent... */
function esTipoEvento(tipo) {
  const tipos = Array.isArray(tipo) ? tipo : [tipo];
  return tipos.some((t) => typeof t === "string" && /event$/i.test(t.trim()));
}

/** Busca el primer nodo schema.org/Event dentro de los bloques JSON-LD. */
function buscarEventoJsonLd(bloques) {
  if (!Array.isArray(bloques)) return null;

  for (const raw of bloques) {
    if (!raw || typeof raw !== "string") continue;

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue; // JSON-LD malformado, se ignora
    }

    const nodos = aplanarJsonLd(data);
    const evento = nodos.find((n) => esTipoEvento(n["@type"]));
    if (evento) return evento;
  }

  return null;
}

// ─── Navegador ────────────────────────────────────────────────────────────

/** Localiza el binario de Chromium instalado en la imagen Alpine. */
function rutaChromium() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidatos = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/lib/chromium/chrome",
  ];

  for (const c of candidatos) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      // sin permisos, seguimos
    }
  }

  return undefined; // puppeteer usará su propio Chrome
}

/** Descarga la página y devuelve el material crudo para analizar. */
async function leerPagina(url) {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: rutaChromium(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(20000);

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
    );

    // domcontentloaded es más seguro que networkidle0, que se cuelga en
    // páginas con trackers o conexiones abiertas.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Margen corto para que se hidraten los meta tags en sitios SPA.
    await new Promise((r) => setTimeout(r, 1200));

    const crudo = await page.evaluate(() => {
      const meta = (selector, attr) => {
        const el = document.querySelector(selector);
        return el ? el.getAttribute(attr) : null;
      };

      const texto = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      return {
        tituloDocumento: document.title || null,
        h1: texto("h1"),
        ogTitulo: meta('meta[property="og:title"]', "content"),
        ogDescripcion: meta('meta[property="og:description"]', "content"),
        ogImagen: meta('meta[property="og:image"]', "content"),
        ogSitio: meta('meta[property="og:site_name"]', "content"),
        metaDescripcion: meta('meta[name="description"]', "content"),
        twitterTitulo: meta('meta[name="twitter:title"]', "content"),
        twitterDescripcion: meta('meta[name="twitter:description"]', "content"),
        twitterImagen: meta('meta[name="twitter:image"]', "content"),
        jsonLd: Array.from(
          document.querySelectorAll('script[type="application/ld+json"]')
        )
          .map((s) => s.textContent)
          .slice(0, 25),
        textoVisible: (document.body ? document.body.innerText : "").slice(0, 8000),
      };
    });

    return crudo;
  } catch (error) {
    console.error(`[Extractor] Error visitando ${url}: ${error.message}`);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignorar
      }
    }
  }
}

// ─── Extracción principal ─────────────────────────────────────────────────

/**
 * Extrae los datos de un evento desde una URL y el texto del mensaje.
 *
 * @param {string} url
 * @param {string} textoMensaje - texto del mensaje de WhatsApp (opcional)
 * @returns {Promise<Object>} Datos con trazabilidad de fuentes
 */
async function extraerEvento(url, textoMensaje = "") {
  const crudo = await leerPagina(url);

  const fuentes = {};
  const advertencias = [];

  const eventoJsonLd = crudo ? buscarEventoJsonLd(crudo.jsonLd) : null;
  if (eventoJsonLd) fuentes.jsonLd = true;

  // ── Título ──
  // Se descartan los títulos genéricos ("Facebook", "Before you continue
  // to YouTube"...) porque no son el nombre del evento.
  let titulo = null;
  if (eventoJsonLd && typeof eventoJsonLd.name === "string") {
    const limpio = limpiarTitulo(eventoJsonLd.name);
    if (limpio && !esTituloGenerico(limpio)) {
      titulo = limpio;
      fuentes.titulo = "json-ld";
    }
  }
  if (!titulo && crudo) {
    for (const [valor, fuente] of [
      [crudo.ogTitulo, "og"],
      [crudo.twitterTitulo, "twitter"],
      [crudo.h1, "html"],
      [crudo.tituloDocumento, "html"],
    ]) {
      const limpio = limpiarTitulo(valor);
      if (limpio && !esTituloGenerico(limpio)) {
        titulo = limpio;
        fuentes.titulo = fuente;
        break;
      }
    }
  }
  // Último recurso: la primera línea útil del propio mensaje de WhatsApp.
  if (!titulo) {
    const desdeCaption = tituloDesdeCaption(textoMensaje);
    if (desdeCaption) {
      titulo = desdeCaption;
      fuentes.titulo = "caption";
    }
  }

  // ── Descripción ──
  let descripcion = null;
  if (eventoJsonLd && typeof eventoJsonLd.description === "string") {
    descripcion =
      eventoJsonLd.description.replace(/\s+/g, " ").trim().slice(0, 2000) || null;
    if (descripcion) fuentes.descripcion = "json-ld";
  }
  if (!descripcion) {
    const elegida = mejorDescripcion(
      textoMensaje,
      crudo ? crudo.ogDescripcion : null,
      crudo ? crudo.metaDescripcion || crudo.twitterDescripcion : null
    );
    if (elegida && elegida.valor) {
      descripcion = elegida.valor.slice(0, 2000);
      fuentes.descripcion = elegida.fuente;
    }
  }

  // ── Imagen ──
  let imagenUrl = null;
  if (eventoJsonLd) {
    imagenUrl = normalizarImagen(eventoJsonLd.image);
    if (imagenUrl) fuentes.imagenUrl = "json-ld";
  }
  if (!imagenUrl && crudo) {
    imagenUrl = crudo.ogImagen || crudo.twitterImagen || null;
    if (imagenUrl) fuentes.imagenUrl = crudo.ogImagen ? "og" : "twitter";
  }
  if (imagenUrl) imagenUrl = imagenUrl.slice(0, 500);

  // ── Fechas ──
  let fecha = null;
  let fechaFin = null;
  let anioInferido = false;
  let tieneHora = false;

  if (eventoJsonLd && eventoJsonLd.startDate) {
    fecha = fechaDesdeIso(String(eventoJsonLd.startDate));
    if (fecha) fuentes.fecha = "json-ld";

    if (eventoJsonLd.endDate) {
      fechaFin = fechaDesdeIso(String(eventoJsonLd.endDate));
      if (fechaFin) fuentes.fechaFin = "json-ld";
    }

    if (fecha) {
      tieneHora = /T\d{2}:\d{2}/.test(String(eventoJsonLd.startDate));
    }
  }

  if (!fecha) {
    // El texto del mensaje suele traer la fecha real del evento,
    // que es justo lo que OpenGraph no aporta.
    const rango = extraerRangoDeTexto(textoMensaje);
    if (rango) {
      fecha = rango.fecha;
      fechaFin = rango.fechaFin;
      anioInferido = rango.anioInferido;
      tieneHora = rango.tieneHora;
      fuentes.fecha = "caption";
      if (fechaFin) fuentes.fechaFin = "caption";

      if (anioInferido) {
        advertencias.push(
          `El mensaje no indicaba el año; se asumió ${fecha.getUTCFullYear()} según el calendario de Loja.`
        );
      }
    }
  }

  // ── Lugar ──
  let lugar = null;
  if (eventoJsonLd && eventoJsonLd.location) {
    lugar = normalizarLugar(eventoJsonLd.location);
    if (lugar) fuentes.lugar = "json-ld";
  }
  if (!lugar) {
    lugar = extraerLugarDeTexto(textoMensaje);
    if (lugar) fuentes.lugar = "caption";
  }
  // Último recurso: el texto visible de la página
  if (!lugar && crudo && crudo.textoVisible) {
    lugar = extraerLugarDeTexto(crudo.textoVisible.slice(0, 3000));
    if (lugar) fuentes.lugar = "html";
  }

  // ── Campos que faltan, para que el moderador los complete ──
  const camposFaltantes = [];
  if (!titulo) camposFaltantes.push("titulo");
  if (!descripcion) camposFaltantes.push("descripcion");
  if (!imagenUrl) camposFaltantes.push("imagenUrl");
  if (!fecha) camposFaltantes.push("fecha");
  if (!lugar) camposFaltantes.push("lugar");

  // ── Confianza ──
  // Mide qué tan completos y confiables son los datos, no si "parece evento".
  let confianza = 0;
  if (eventoJsonLd) confianza += 0.4;
  if (fuentes.fecha === "json-ld") confianza += 0.2;
  else if (fuentes.fecha === "caption") confianza += 0.1;
  if (fuentes.lugar === "json-ld") confianza += 0.15;
  else if (fuentes.lugar === "caption") confianza += 0.1;
  if (imagenUrl) confianza += 0.1;
  if (titulo) confianza += 0.1;
  if (descripcion) confianza += 0.05;
  confianza = Math.max(0, Math.min(1, Number(confianza.toFixed(2))));

  return {
    urlOriginal: url,
    titulo,
    descripcion,
    imagenUrl,
    fecha,
    fechaFin,
    lugar,
    tieneHora,
    fuentes,
    camposFaltantes,
    advertencias,
    confianza,
    jsonLdEncontrado: Boolean(eventoJsonLd),
  };
}

/**
 * Compatibilidad: extrae la info de una sola URL.
 * @deprecated Usar `extraerEvento(url, textoMensaje)`, que aporta más contexto.
 */
async function extractEventInfo(url) {
  return extraerEvento(url, "");
}

// ─── Flujo completo: mensaje → posts en BD ────────────────────────────────

/**
 * Procesa un texto, visita sus URLs y guarda cada hallazgo como post pendiente.
 *
 * @param {string} text - Texto del mensaje de WhatsApp
 * @param {string} grupoId - Identificador del grupo
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<Array>} Posts creados
 */
async function extractAndProcessUrls(text, grupoId, prisma) {
  const urls = extractUrls(text);
  if (urls.length === 0) return [];

  console.log(`[Extractor] ${urls.length} URL(s) encontradas: ${urls.join(", ")}`);

  const posts = [];

  for (const url of urls) {
    try {
      const datos = await extraerEvento(url, text);

      // Las URLs de imagen de Facebook e Instagram caducan en días.
      // Se descarga la imagen y se sube a nuestro CDN para que la URL
      // guardada siga funcionando cuando el post se publique.
      let imagenFinal = datos.imagenUrl;
      if (
        imagenFinal &&
        bunnyConfigurado() &&
        process.env.REHOSPEDAR_IMAGENES !== "false"
      ) {
        const permanente = await rehospedarImagen(imagenFinal, "whatsapp");
        if (permanente) imagenFinal = permanente;
      }

      const post = await prisma.postSocial.create({
        data: {
          origen: "WHATSAPP_GRUPO",
          urlOriginal: datos.urlOriginal,
          textoOriginal: text ? text.slice(0, 5000) : null,
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          imagenUrl: imagenFinal,
          fechaPublicacion: datos.fecha,
          lugar: datos.lugar,
          estado: "PENDIENTE",
          grupoId: grupoId || null,
          confianzaIA: datos.confianza,
        },
      });

      posts.push({
        id: post.id,
        url,
        fuentes: datos.fuentes,
        camposFaltantes: datos.camposFaltantes,
        advertencias: datos.advertencias,
        confianza: datos.confianza,
      });

      console.log(
        `[Extractor] Post #${post.id} creado — confianza ${datos.confianza}` +
          (datos.camposFaltantes.length
            ? ` — faltan: ${datos.camposFaltantes.join(", ")}`
            : " — completo")
      );
    } catch (err) {
      console.error(`[Extractor] Error procesando ${url}:`, err.message);
    }
  }

  return posts;
}

module.exports = {
  extractAndProcessUrls,
  extractUrls,
  extractEventInfo,
  extraerEvento,
  // Exportados para pruebas unitarias
  limpiarTitulo,
  esTituloGenerico,
  tituloDesdeCaption,
  limpiarLugar,
  extraerLugarDeTexto,
  buscarEventoJsonLd,
  aplanarJsonLd,
  esTipoEvento,
};
