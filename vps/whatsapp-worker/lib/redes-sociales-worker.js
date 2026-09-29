/**
 * Módulo de publicación en redes sociales para el WhatsApp Worker
 *
 * Este módulo conecta el auto-publish del worker con el scheduler de redes sociales
 * en Vercel (https://redes-sociales-l5q4.vercel.app).
 *
 * IMPORTANTE: No instancia Prisma internamente. Recibe el cliente ya configurado
 * con PrismaMariaDb como argumento en cada función, igual al patrón del worker principal.
 *
 * Incluye límite de 5 publicaciones diarias para evitar spam.
 */

/**
 * Configuración del webhook de redes sociales
 */
const REDES_SOCIALES_WEBHOOK_URL = process.env.REDES_SOCIALES_WEBHOOK_URL ||
  "https://redes-sociales-l5q4.vercel.app/api/external/agenda-cultural/schedule";

const REDES_SOCIALES_API_KEY = process.env.REDES_SOCIALES_API_KEY ||
  process.env.AGENDA_CULTURAL_API_KEY ||
  "agenda_sec_7f9b2c3e1a4d85206";

const MAX_PUBLICACIONES_DIARIAS = Number(process.env.MAX_DAILY_SOCIAL_POSTS) || 5;

/**
 * Construye el caption optimizado para redes sociales
 */
function construirCaptionRedes(evento) {
  const fechaStr = new Date(evento.fecha).toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Guayaquil",
  });
  const horaStr = new Date(evento.fecha).toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Guayaquil",
  });

  const catTag = evento.categoria?.nombre
    ? `#${evento.categoria.nombre.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "")}`
    : "#CulturaLoja";

  const descCorta =
    evento.descripcion.length > 280
      ? `${evento.descripcion.substring(0, 277)}...`
      : evento.descripcion;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.agendaculturalloja.com").replace(/\/$/, "");
  const webUrl = `${appUrl}/eventos/${evento.slug}`;

  return `🎭 ${evento.nombre}

📍 Lugar: ${evento.lugar}
📅 Fecha: ${fechaStr}
⏰ Hora: ${horaStr}

${descCorta}

🔗 Más detalles y ubicación en:
${webUrl}

#AgendaCultural #Loja #CulturaLoja #EventosLoja ${catTag}`;
}

// Horarios óptimos de mayor engagement cultural en Loja (UTC-5):
// 09:00 (inicio de jornada), 11:30 (antes de almuerzo), 14:00 (sobremesa), 16:30 (tarde), 19:00 (salida/noche)
const HORARIOS_SLOTS_LOJA = [
  { hora: 9, minuto: 0 },
  { hora: 11, minuto: 30 },
  { hora: 14, minuto: 0 },
  { hora: 16, minuto: 30 },
  { hora: 19, minuto: 0 },
];

/**
 * Obtiene la fecha/hora en la zona horaria de Loja (America/Guayaquil, UTC-5).
 */
function getFechaHoraLoja(fecha = new Date()) {
  const utc = fecha.getTime() + fecha.getTimezoneOffset() * 60000;
  return new Date(utc - 5 * 3600000);
}

/**
 * Convierte una fecha y hora local de Loja (UTC-5) a objeto Date UTC real.
 */
function crearFechaDesdeLoja(anio, mes, dia, hora, minuto) {
  // En UTC, Loja (UTC-5) es hora + 5 horas
  return new Date(Date.UTC(anio, mes, dia, hora + 5, minuto, 0, 0));
}

/**
 * Asigna una franja horaria inteligente a lo largo del día (entre 09:00 y 19:00 hora Loja)
 * respetando las publicaciones ya programadas para no amontonarlas.
 *
 * @param {Date|string} fechaEvento - Fecha de realización del evento
 * @param {Array<Date>} fechasOcupadas - Horas ya reservadas hoy para evitar solapamientos
 * @returns {string} Fecha ISO para scheduledAt
 */
function calcularFechaProgramadaHumana(fechaEvento, fechasOcupadas = []) {
  const ahora = new Date();
  const ahoraLoja = getFechaHoraLoja(ahora);
  const evDate = new Date(fechaEvento);
  const diffHoras = (evDate.getTime() - ahora.getTime()) / (1000 * 60 * 60);

  // Determinar si debemos publicar hoy o el día del target promocional
  let targetAnio = ahoraLoja.getFullYear();
  let targetMes = ahoraLoja.getMonth();
  let targetDia = ahoraLoja.getDate();

  if (diffHoras > 48) {
    // Evento a futuro: promocionar 2 días antes del evento
    const fechaPromo = new Date(evDate.getTime() - 48 * 3600000);
    const promoLoja = getFechaHoraLoja(fechaPromo);
    // Si la fecha promo es hoy o futura, la usamos
    if (fechaPromo.getTime() > ahora.getTime()) {
      targetAnio = promoLoja.getFullYear();
      targetMes = promoLoja.getMonth();
      targetDia = promoLoja.getDate();
    }
  }

  // Buscar el primer slot disponible en el día target
  for (const slot of HORARIOS_SLOTS_LOJA) {
    const candidateUtc = crearFechaDesdeLoja(
      targetAnio,
      targetMes,
      targetDia,
      slot.hora,
      slot.minuto
    );

    // Debe ser al menos 15 minutos en el futuro
    if (candidateUtc.getTime() < ahora.getTime() + 15 * 60 * 1000) {
      continue;
    }

    // Verificar que no haya otra publicación en un rango menor a 60 minutos
    const estaOcupado = fechasOcupadas.some((f) => {
      const diffMin = Math.abs(new Date(f).getTime() - candidateUtc.getTime()) / 60000;
      return diffMin < 60;
    });

    if (!estaOcupado) {
      return candidateUtc.toISOString();
    }
  }

  // Si todos los slots de hoy ya pasaron o están ocupados:
  // Pasamos al día siguiente a partir del primer slot (09:00 AM)
  const mananaLoja = new Date(ahoraLoja.getTime() + 24 * 3600000);
  for (const slot of HORARIOS_SLOTS_LOJA) {
    const candidateManana = crearFechaDesdeLoja(
      mananaLoja.getFullYear(),
      mananaLoja.getMonth(),
      mananaLoja.getDate(),
      slot.hora,
      slot.minuto
    );

    const estaOcupado = fechasOcupadas.some((f) => {
      const diffMin = Math.abs(new Date(f).getTime() - candidateManana.getTime()) / 60000;
      return diffMin < 60;
    });

    if (!estaOcupado) {
      return candidateManana.toISOString();
    }
  }

  // Fallback seguro: en 2 horas si todo estuviese ocupado
  return new Date(ahora.getTime() + 2 * 3600000).toISOString();
}

/**
 * Verifica si ya se alcanzó el límite de publicaciones diarias
 * @param {Object} prisma - Cliente Prisma ya inicializado con adapter
 */
async function verificarLimiteDiario(prisma) {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const finDia = new Date();
  finDia.setHours(23, 59, 59, 999);

  let count = 0;
  try {
    if (prisma.publicacionRedSocial) {
      count = await prisma.publicacionRedSocial.count({
        where: {
          createdAt: { gte: inicioDia, lte: finDia },
          estado: { in: ['PENDIENTE', 'PROGRAMADO', 'PUBLICADO'] },
        },
      });
    } else {
      const rows = await prisma.$queryRaw`
        SELECT COUNT(*) as total FROM publicaciones_redes_sociales 
        WHERE created_at >= ${inicioDia} AND created_at <= ${finDia} 
        AND estado IN ('PENDIENTE', 'PROGRAMADO', 'PUBLICADO')
      `;
      count = Number(rows?.[0]?.total || 0);
    }
  } catch (err) {
    console.warn("[RedesSociales] Advertencia consultando límite:", err.message);
  }

  return {
    count,
    limite: MAX_PUBLICACIONES_DIARIAS,
    disponible: count < MAX_PUBLICACIONES_DIARIAS,
  };
}

/**
 * Programa la publicación de un evento en redes sociales
 *
 * @param {number} eventoId - ID del evento a publicar
 * @param {Object} prisma - Cliente Prisma ya inicializado con PrismaMariaDb
 * @param {Object} opciones - Opciones adicionales
 * @param {boolean} opciones.forzar - Forzar aunque se haya alcanzado el límite diario
 * @returns {Promise<Object>} Resultado de la operación
 */
async function programarPublicacionEnRedes(eventoId, prisma, hermesCopy = null, opciones = {}) {
  const forzar = Boolean(opciones && opciones.forzar);

  try {
    // ── MODO SEGURO: VERIFICAR PAUSA DE REDES SOCIALES ──
    const redesPausadas = process.env.REDES_PAUSADAS_PRUEBA === "true" || process.env.PAUSA_EMERGENCIA === "true";
    if (redesPausadas && !forzar) {
      console.log(`[RedesSociales] 🛑 MODO SEGURO ACTIVO (REDES_PAUSADAS_PRUEBA=true). Publicación en redes pausada para evento #${eventoId}`);
      return {
        success: false,
        motivo: "Publicaciones en redes en pausa para pruebas controladas 1 a 1",
      };
    }

    // Verificar límite diario (excepto si se fuerza)
    if (!forzar) {
      const limite = await verificarLimiteDiario(prisma);
      if (!limite.disponible) {
        console.log(`[RedesSociales] ⚠️ Límite diario alcanzado (${limite.count}/${limite.limite}). Publicación omitida para evento #${eventoId}`);
        return {
          success: false,
          motivo: `Límite diario de ${MAX_PUBLICACIONES_DIARIAS} publicaciones alcanzado (${limite.count} hoy)`,
          limiteDiario: limite,
        };
      }
    }

    // Obtener evento con relaciones
    const evento = await prisma.evento.findUnique({
      where: { id: eventoId },
      include: {
        categoria: true,
        zona: true,
      },
    });

    if (!evento) {
      return { success: false, error: `Evento ${eventoId} no existe.` };
    }

    if (evento.estado !== "APROBADO") {
      return {
        success: false,
        motivo: `El evento ${eventoId} no está aprobado (estado actual: ${evento.estado}).`,
      };
    }

    // Verificar si ya fue programado (seguro con queryRaw si el modelo no está en prisma client)
    let existente = null;
    try {
      if (prisma.publicacionRedSocial) {
        existente = await prisma.publicacionRedSocial.findFirst({ where: { eventoId } });
      } else {
        const rows = await prisma.$queryRaw`
          SELECT id, estado FROM publicaciones_redes_sociales WHERE evento_id = ${eventoId} LIMIT 1
        `;
        if (rows && rows.length > 0) existente = rows[0];
      }
    } catch (e) {
      console.warn("[RedesSociales] Advertencia verificando existente:", e.message);
    }

    if (existente) {
      console.log(`[RedesSociales] ℹ️ Evento #${eventoId} ya programado en redes (estado: ${existente.estado})`);
      return {
        success: true,
        motivo: "Ya programado anteriormente",
        detalles: existente,
      };
    }

    // Consultar horarios de publicaciones ya programadas para hoy/mañana para no solapar
    let fechasOcupadas = [];
    try {
      if (prisma.publicacionRedSocial) {
        const pubs = await prisma.publicacionRedSocial.findMany({
          where: { estado: { in: ["PENDIENTE", "PROGRAMADO"] } },
          select: { programadoAt: true },
          take: 20,
        });
        fechasOcupadas = pubs.map((p) => p.programadoAt);
      } else {
        const rows = await prisma.$queryRaw`
          SELECT programado_at as programadoAt FROM publicaciones_redes_sociales 
          WHERE estado IN ('PENDIENTE', 'PROGRAMADO') LIMIT 20
        `;
        fechasOcupadas = (rows || []).map((r) => r.programadoAt);
      }
    } catch (e) {
      console.warn("[RedesSociales] Advertencia consultando fechas ocupadas:", e.message);
    }

    // Construir caption: si Hermes generó un copy optimizado, usarlo.
    // Si no, usar el caption estándar basado en los datos del evento.
    let caption;
    if (hermesCopy && hermesCopy.copy_instagram) {
      caption = hermesCopy.copy_instagram;
      console.log(`[RedesSociales] 🧠 Usando copy de Hermes (${hermesCopy.fuente || 'hermes'}) para evento #${eventoId}`);
    } else {
      caption = construirCaptionRedes(evento);
    }
    const scheduledAt = calcularFechaProgramadaHumana(evento.fecha, fechasOcupadas);

    // Preparar multimedia
    let multimediaArray = [];
    if (Array.isArray(evento.multimedia)) {
      multimediaArray = evento.multimedia.filter(
        (url) => typeof url === "string" && url.trim().length > 0
      );
    }
    const fotoPrincipal = evento.imagenUrl || (multimediaArray.length > 0 ? multimediaArray[0] : null);

    // Determinar formato
    let payload;
    let tipoPublicacion;
    let plataformas = ["FACEBOOK", "INSTAGRAM"];

    if (evento.videoUrl && evento.videoUrl.endsWith(".mp4")) {
      payload = {
        caption,
        mediaUrl: evento.videoUrl,
        type: "REEL",
        scheduledAt,
        platforms: plataformas,
      };
      tipoPublicacion = "REEL";
    } else if (multimediaArray.length > 1) {
      payload = {
        caption,
        type: "CAROUSEL",
        mediaItems: multimediaArray.map((url) => ({
          url,
          type: "IMAGE",
        })),
        scheduledAt,
        platforms: plataformas,
      };
      tipoPublicacion = "CAROUSEL";
    } else if (fotoPrincipal) {
      payload = {
        caption,
        mediaUrl: fotoPrincipal,
        type: "FEED_POST",
        scheduledAt,
        platforms: plataformas,
      };
      tipoPublicacion = "FEED_POST";
    } else {
      return {
        success: false,
        motivo: "El evento no posee imagen ni video para publicar en Instagram/Facebook.",
      };
    }

    // Agregar secret
    payload.secret = REDES_SOCIALES_API_KEY;

    // Llamar al webhook
    console.log(`[RedesSociales] 📤 Enviando al scheduler: evento #${eventoId}, tipo: ${tipoPublicacion}, programado para: ${scheduledAt}`);
    
    const res = await fetch(REDES_SOCIALES_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": REDES_SOCIALES_API_KEY,
        "User-Agent": "AgendaCulturalLoja-Worker/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    const respuestaTexto = await res.text().catch(() => "");
    let respuestaJson = {};
    try {
      respuestaJson = JSON.parse(respuestaTexto);
    } catch {}

    if (!res.ok) {
      console.warn(`[RedesSociales] ❌ Error del servicio (${res.status}): ${respuestaTexto}`);
      
      // Registrar fallo en BD
      await prisma.publicacionRedSocial.create({
        data: {
          eventoId,
          plataformas: JSON.stringify(plataformas),
          tipo: tipoPublicacion,
          programadoAt: new Date(scheduledAt),
          estado: "FALLIDO",
          error: `Error ${res.status}: ${respuestaTexto}`,
          respuestaApi: respuestaJson,
        },
      });

      return {
        success: false,
        error: `Error ${res.status}: ${respuestaTexto}`,
      };
    }

    console.log(`[RedesSociales] ✅ Publicación programada con éxito para evento #${evento.id}`);

    // Registrar éxito en BD
    let registroId = null;
    try {
      if (prisma.publicacionRedSocial) {
        const registro = await prisma.publicacionRedSocial.create({
          data: {
            eventoId,
            plataformas: JSON.stringify(plataformas),
            tipo: tipoPublicacion,
            programadoAt: new Date(scheduledAt),
            estado: "PROGRAMADO",
            respuestaApi: respuestaJson,
          },
        });
        registroId = registro.id;
      } else {
        await prisma.$executeRaw`
          INSERT INTO publicaciones_redes_sociales (evento_id, plataforma, tipo, programado_at, estado, respuestaApi, created_at, updated_at)
          VALUES (${eventoId}, ${plataformas[0] || 'INSTAGRAM'}, ${tipoPublicacion}, ${new Date(scheduledAt)}, 'PROGRAMADO', ${JSON.stringify(respuestaJson)}, NOW(), NOW())
        `;
      }
    } catch (dbSuccessErr) {
      console.warn("[RedesSociales] Advertencia guardando registro exitoso:", dbSuccessErr.message);
    }

    return {
      success: true,
      detalles: { ...respuestaJson, registroId },
    };

  } catch (error) {
    console.error("[RedesSociales] 💥 Excepción al programar publicación:", error?.message || error);
    
    // Intentar registrar el error en BD
    try {
      if (prisma.publicacionRedSocial) {
        await prisma.publicacionRedSocial.create({
          data: {
            eventoId,
            plataformas: JSON.stringify(["FACEBOOK", "INSTAGRAM"]),
            tipo: "FEED_POST",
            programadoAt: new Date(),
            estado: "FALLIDO",
            error: error?.message || "Error de red al conectar con el webhook de redes sociales",
          },
        });
      }
    } catch (dbErr) {
      console.error("[RedesSociales] Error guardando registro de fallo:", dbErr.message);
    }

    return {
      success: false,
      error: error?.message || "Error de red al conectar con el webhook de redes sociales",
    };
  }
}

/**
 * Obtiene estadísticas de publicaciones del día actual
 * @param {Object} prisma - Cliente Prisma ya inicializado con PrismaMariaDb
 */
async function obtenerEstadisticasHoy(prisma) {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  
  const finDia = new Date();
  finDia.setHours(23, 59, 59, 999);

  const [total, porEstado] = await Promise.all([
    prisma.publicacionRedSocial.count({
      where: {
        createdAt: { gte: inicioDia, lte: finDia },
      },
    }),
    prisma.publicacionRedSocial.groupBy({
      by: ['estado'],
      where: {
        createdAt: { gte: inicioDia, lte: finDia },
      },
      _count: { estado: true },
    }),
  ]);

  return {
    total,
    porEstado: porEstado.reduce((acc, item) => {
      acc[item.estado] = item._count.estado;
      return acc;
    }, {}),
    limite: MAX_PUBLICACIONES_DIARIAS,
    disponibles: Math.max(0, MAX_PUBLICACIONES_DIARIAS - total),
  };
}

module.exports = {
  programarPublicacionEnRedes,
  verificarLimiteDiario,
  obtenerEstadisticasHoy,
  MAX_PUBLICACIONES_DIARIAS,
  REDES_SOCIALES_WEBHOOK_URL,
};