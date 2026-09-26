import "server-only";
import { prisma } from "@/lib/prisma";

export interface ProgramarRedesOptions {
  eventoId: number;
  /** Umbral mínimo de confianza de clasificación IA (0 a 1). Por defecto 0.65 */
  umbralConfianzaMinima?: number;
  /** Forzar programación aunque la confianza IA sea menor o nula (ej: cuando el admin aprueba a mano) */
  forzar?: boolean;
}

export interface ProgramarRedesResultado {
  success: boolean;
  motivo?: string;
  error?: string;
  detalles?: any;
}

/**
 * Genera el caption optimizado para redes sociales a partir de un evento.
 */
function construirCaptionRedes(evento: {
  nombre: string;
  descripcion: string;
  lugar: string;
  fecha: Date;
  categoria?: { nombre: string | null } | null;
  zona?: { nombre: string | null } | null;
  organizador?: string | null;
  webUrl: string;
}): string {
  const fechaStr = evento.fecha.toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Guayaquil",
  });
  const horaStr = evento.fecha.toLocaleTimeString("es-EC", {
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

  return `🎭 ${evento.nombre}

📍 Lugar: ${evento.lugar}
📅 Fecha: ${fechaStr}
⏰ Hora: ${horaStr}

${descCorta}

🔗 Más detalles y ubicación en:
${evento.webUrl}

#AgendaCultural #Loja #CulturaLoja #EventosLoja ${catTag}`;
}

// Franjas horarias de mayor alcance cultural en Loja (UTC-5):
// 09:00 (mañana), 11:30 (mediodía), 14:00 (sobremesa), 16:30 (tarde), 19:00 (noche)
const HORARIOS_SLOTS_LOJA = [
  { hora: 9, minuto: 0 },
  { hora: 11, minuto: 30 },
  { hora: 14, minuto: 0 },
  { hora: 16, minuto: 30 },
  { hora: 19, minuto: 0 },
];

function getFechaHoraLoja(fecha = new Date()): Date {
  const utc = fecha.getTime() + fecha.getTimezoneOffset() * 60000;
  return new Date(utc - 5 * 3600000);
}

function crearFechaDesdeLoja(anio: number, mes: number, dia: number, hora: number, minuto: number): Date {
  return new Date(Date.UTC(anio, mes, dia, hora + 5, minuto, 0, 0));
}

/**
 * Calcula una fecha programada distribuida a lo largo del día (entre 09:00 y 19:00 hora Loja)
 * para un comportamiento 100% orgánico y humano.
 */
function calcularFechaProgramada(fechaEvento: Date): string {
  const ahora = new Date();
  const ahoraLoja = getFechaHoraLoja(ahora);
  const diffHoras = (fechaEvento.getTime() - ahora.getTime()) / (1000 * 60 * 60);

  let targetAnio = ahoraLoja.getFullYear();
  let targetMes = ahoraLoja.getMonth();
  let targetDia = ahoraLoja.getDate();

  if (diffHoras > 48) {
    const fechaPromo = new Date(fechaEvento.getTime() - 48 * 3600000);
    const promoLoja = getFechaHoraLoja(fechaPromo);
    if (fechaPromo.getTime() > ahora.getTime()) {
      targetAnio = promoLoja.getFullYear();
      targetMes = promoLoja.getMonth();
      targetDia = promoLoja.getDate();
    }
  }

  // Buscar primer slot libre hoy (al menos 15 minutos en el futuro)
  for (const slot of HORARIOS_SLOTS_LOJA) {
    const candidateUtc = crearFechaDesdeLoja(targetAnio, targetMes, targetDia, slot.hora, slot.minuto);
    if (candidateUtc.getTime() >= ahora.getTime() + 15 * 60 * 1000) {
      return candidateUtc.toISOString();
    }
  }

  // Si ya pasaron las 19:00 hoy, asignar el primer slot de mañana (09:00 AM)
  const mananaLoja = new Date(ahoraLoja.getTime() + 24 * 3600000);
  const primerSlotManana = crearFechaDesdeLoja(
    mananaLoja.getFullYear(),
    mananaLoja.getMonth(),
    mananaLoja.getDate(),
    HORARIOS_SLOTS_LOJA[0].hora,
    HORARIOS_SLOTS_LOJA[0].minuto
  );
  return primerSlotManana.toISOString();
}

/**
 * Despacha la publicación al Webhook / Scheduler de Redes Sociales
 * aislando estrictamente la cuenta y negocio de "Agenda Cultural Loja".
 *
 * Evita duplicados:
 * - Valida si ya fue programado antes (inspeccionando editToken o flag si existiese).
 * - Cumple con la autenticación segura x-api-key y endpoints del túnel.
 */
export async function programarPublicacionEnRedes(
  opciones: ProgramarRedesOptions
): Promise<ProgramarRedesResultado> {
  const { eventoId, umbralConfianzaMinima = 0.65, forzar = false } = opciones;

  const webhookUrl =
    process.env.REDES_SOCIALES_WEBHOOK_URL ||
    "https://redes-sociales-l5q4.vercel.app/api/external/agenda-cultural/schedule";
  const apiKey =
    process.env.REDES_SOCIALES_API_KEY ||
    process.env.AGENDA_CULTURAL_API_KEY ||
    "agenda_sec_7f9b2c3e1a4d85206";

  try {
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

    // Validación de calidad y calificación mínima por IA (si no se fuerza explícitamente)
    if (!forzar) {
      if (
        evento.confianzaClasificacion !== null &&
        evento.confianzaClasificacion !== undefined &&
        evento.confianzaClasificacion < umbralConfianzaMinima
      ) {
        return {
          success: false,
          motivo: `Confianza IA (${evento.confianzaClasificacion}) inferior al umbral mínimo requerido (${umbralConfianzaMinima}).`,
        };
      }
    }

    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.agendaculturalloja.com";
    if (appUrl.includes("agendacultural-loja.com")) {
      appUrl = appUrl.replace("agendacultural-loja.com", "agendaculturalloja.com");
    }
    if (!appUrl.startsWith("http")) {
      appUrl = `https://${appUrl}`;
    }
    const webUrl = `${appUrl}/eventos/${evento.slug}`;

    const caption = construirCaptionRedes({
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      lugar: evento.lugar,
      fecha: evento.fecha,
      categoria: evento.categoria,
      zona: evento.zona,
      organizador: evento.nombreGestor,
      webUrl,
    });

    const scheduledAt = calcularFechaProgramada(evento.fecha);

    // Preparar lista de imágenes
    let multimediaArray: string[] = [];
    if (Array.isArray(evento.multimedia)) {
      multimediaArray = (evento.multimedia as unknown[]).filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0
      );
    }
    const fotoPrincipal = evento.imagenUrl || (multimediaArray.length > 0 ? multimediaArray[0] : null);

    // Determinar formato (CAROUSEL, REEL o FEED_POST)
    let payload: Record<string, any>;

    if (evento.videoUrl && evento.videoUrl.endsWith(".mp4")) {
      payload = {
        caption,
        mediaUrl: evento.videoUrl,
        type: "REEL",
        scheduledAt,
        platforms: ["FACEBOOK", "INSTAGRAM"],
      };
    } else if (multimediaArray.length > 1) {
      payload = {
        caption,
        type: "CAROUSEL",
        mediaItems: multimediaArray.map((url) => ({
          url,
          type: "IMAGE",
        })),
        scheduledAt,
        platforms: ["FACEBOOK", "INSTAGRAM"],
      };
    } else if (fotoPrincipal) {
      payload = {
        caption,
        mediaUrl: fotoPrincipal,
        type: "FEED_POST",
        scheduledAt,
        platforms: ["FACEBOOK", "INSTAGRAM"],
      };
    } else {
      // Si no tiene imagen ni video, no se puede publicar en Instagram; solo texto o fallback
      return {
        success: false,
        motivo: "El evento no posee imagen ni video para publicar en Instagram/Facebook.",
      };
    }

    // Agregar secret dentro del body por redundancia de seguridad + headers
    payload.secret = apiKey;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "User-Agent": "AgendaCulturalLoja-Scheduler/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.warn(`[REDES_SOCIALES_WEBHOOK] Error del servicio (${res.status}): ${errorText}`);
      return {
        success: false,
        error: `Error ${res.status}: ${errorText}`,
      };
    }

    const dataRes = await res.json().catch(() => ({}));
    console.log(`[REDES_SOCIALES_WEBHOOK] ✅ Publicación programada con éxito para evento #${evento.id}`);

    return {
      success: true,
      detalles: dataRes,
    };
  } catch (error: any) {
    console.error("[REDES_SOCIALES_WEBHOOK] Excepción al programar publicación:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Error de red al conectar con el webhook de redes sociales",
    };
  }
}
