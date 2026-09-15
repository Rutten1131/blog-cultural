import "server-only";
import { prisma } from "@/lib/prisma";

export interface HermesWebhookPayload {
  event: "evento.creado" | "evento.aprobado" | "evento.actualizado";
  businessId: string;
  timestamp: string;
  data: {
    id: number;
    slug: string;
    nombre: string;
    descripcion: string;
    lugar: string;
    fechaInicio: string;
    fechaFin: string | null;
    categoria: {
      id: number | null;
      nombre: string | null;
      slug: string | null;
    };
    zona: {
      id: number | null;
      nombre: string | null;
      tipo: string | null;
    };
    organizador: {
      nombreGestor: string;
      institucionRelacionada: string | null;
    };
    media: {
      imagenUrl: string | null;
      multimedia: string[];
      videoUrl: string | null;
    };
    links: {
      webUrl: string;
      adminUrl: string;
    };
    evaluacionIA: {
      confianzaClasificacion: number | null;
      origen: "agenda_cultural_loja_web";
    };
  };
}

/**
 * Despacha un evento a Hermes en el VPS para que la IA decida si publicarlo en redes sociales.
 * No bloquea la ejecución de la app (fail-safe).
 */
export async function despacharEventoAHermes(
  eventoId: number,
  tipoEvento: "evento.creado" | "evento.aprobado" | "evento.actualizado" = "evento.aprobado"
): Promise<{ success: boolean; error?: string }> {
  const hermesUrl = process.env.HERMES_WEBHOOK_URL;
  const hermesSecret = process.env.HERMES_WEBHOOK_SECRET;
  const businessId = process.env.HERMES_BUSINESS_ID || "agenda_cultural_loja";

  if (!hermesUrl) {
    // Si no está configurada la URL aún, omitir en silencio para no romper flujos locales
    return { success: false, error: "HERMES_WEBHOOK_URL no configurada" };
  }

  try {
    const evento = await prisma.evento.findUnique({
      where: { id: eventoId },
      include: {
        categoria: true,
        zona: true,
      },
    });

    if (!evento) {
      return { success: false, error: "Evento no encontrado" };
    }

    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.agendaculturalloja.com";
    if (appUrl.includes("agendacultural-loja.com")) {
      appUrl = appUrl.replace("agendacultural-loja.com", "agendaculturalloja.com");
    }
    if (!appUrl.startsWith("http")) {
      appUrl = `https://${appUrl}`;
    }

    // Normalizar multimedia si es un arreglo Json
    let imagenesGaleria: string[] = [];
    if (Array.isArray(evento.multimedia)) {
      imagenesGaleria = (evento.multimedia as unknown[]).filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0
      );
    }

    const payload: HermesWebhookPayload = {
      event: tipoEvento,
      businessId,
      timestamp: new Date().toISOString(),
      data: {
        id: evento.id,
        slug: evento.slug,
        nombre: evento.nombre,
        descripcion: evento.descripcion,
        lugar: evento.lugar,
        fechaInicio: evento.fecha.toISOString(),
        fechaFin: evento.fechaFin ? evento.fechaFin.toISOString() : null,
        categoria: {
          id: evento.categoriaId,
          nombre: evento.categoria?.nombre || null,
          slug: evento.categoria?.slug || null,
        },
        zona: {
          id: evento.zonaId,
          nombre: evento.zona?.nombre || null,
          tipo: evento.zona?.tipo || null,
        },
        organizador: {
          nombreGestor: evento.nombreGestor,
          institucionRelacionada: evento.institucionRelacionada,
        },
        media: {
          imagenUrl: evento.imagenUrl,
          multimedia: imagenesGaleria,
          videoUrl: evento.videoUrl,
        },
        links: {
          webUrl: `${appUrl}/eventos/${evento.slug}`,
          adminUrl: `${appUrl}/admin`,
        },
        evaluacionIA: {
          confianzaClasificacion: evento.confianzaClasificacion,
          origen: "agenda_cultural_loja_web",
        },
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "AgendaCulturalLoja-Webhook/1.0",
    };

    if (hermesSecret) {
      headers["Authorization"] = `Bearer ${hermesSecret}`;
      headers["x-webhook-secret"] = hermesSecret;
    }

    const res = await fetch(hermesUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // Timeout de 10 segundos
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.warn(`[HERMES_WEBHOOK] Error del VPS (${res.status}): ${errorText}`);
      return { success: false, error: `Error ${res.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[HERMES_WEBHOOK] Excepción al despachar evento a Hermes:", error?.message || error);
    return { success: false, error: error?.message || "Error de red al conectar con Hermes" };
  }
}
