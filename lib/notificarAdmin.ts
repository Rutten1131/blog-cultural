import "server-only";
import { prisma } from "@/lib/prisma";

export interface NotificacionEventoData {
  id: number;
  nombre: string;
  fechaFormateada: string;
  lugar: string;
  nombreGestor: string;
  institucionRelacionada?: string | null;
  categoriaSugerida?: string | null;
}

/**
 * Envía una notificación a WhatsApp mediante Evolution API.
 * Los números destinatarios se obtienen de la tabla numeros_notificacion (activos).
 *
 * Variables de entorno requeridas en .env.local:
 * - EVOLUTION_API_URL
 * - EVOLUTION_API_KEY
 * - EVOLUTION_INSTANCE
 * - NEXT_PUBLIC_APP_URL (para el link al admin)
 */
export async function notificarNuevoEventoAdmin(datos: NotificacionEventoData): Promise<void> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agendacultural-loja.com";

  const mensaje = `🔔 *NUEVO EVENTO PENDIENTE DE REVISIÓN*

🎭 *Evento:* ${datos.nombre}
📅 *Fecha:* ${datos.fechaFormateada}
📍 *Lugar:* ${datos.lugar}
👤 *Organiza:* ${datos.nombreGestor}
🏛️ *Ámbito/Institución:* ${datos.institucionRelacionada || "No especificada"}
🏷️ *Categoría sugerida:* ${datos.categoriaSugerida || "Por clasificar"}

👉 *Revisar en el Panel de Moderación:*
${appUrl}/admin`;

  // Si no están configuradas las credenciales de Evolution, loguear y salir
  if (!apiUrl || !apiKey || !instance) {
    console.log("[NOTIFICACION WHATSAPP - Evolution API no configurada]");
    console.log(mensaje);
    return;
  }

  // Obtener números activos desde la base de datos
  let destinatarios: { numero: string; nombre: string }[] = [];
  try {
    destinatarios = await prisma.numeroNotificacion.findMany({
      where: { activo: true },
      select: { numero: true, nombre: true },
    });
  } catch (err) {
    console.error("Error obteniendo números de notificación:", err);
    return;
  }

  if (destinatarios.length === 0) {
    console.log("[NOTIFICACION WHATSAPP] No hay números activos configurados en el panel admin.");
    return;
  }

  const endpoint = `${apiUrl.replace(/\/$/, "")}/message/sendText/${instance}`;

  // Enviar a cada destinatario activo
  for (const dest of destinatarios) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: dest.numero,
          options: {
            delay: 1200,
            presence: "composing",
            linkPreview: false,
          },
          textMessage: {
            text: mensaje,
          },
        }),
      });

      if (!res.ok) {
        console.error(
          `Error enviando a ${dest.nombre} (${dest.numero}):`,
          res.status,
          await res.text()
        );
      } else {
        console.log(`✅ Notificación enviada a ${dest.nombre} (+${dest.numero})`);
      }
    } catch (error) {
      console.error(`Fallo de red al notificar a ${dest.nombre}:`, error);
    }
  }
}
