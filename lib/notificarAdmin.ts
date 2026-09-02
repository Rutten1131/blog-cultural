import "server-only";

interface NotificacionEventoData {
  id: number;
  nombre: string;
  fechaFormateada: string;
  lugar: string;
  nombreGestor: string;
  institucionRelacionada?: string | null;
  categoriaSugerida?: string | null;
}

/**
 * Envía una notificación a WhatsApp (vía Evolution API o webhook)
 * para alertar al administrador de un nuevo evento pendiente de revisión.
 *
 * Variables de entorno requeridas (opcionales para no romper en desarrollo):
 * - EVOLUTION_API_URL: e.g. "https://api.evolution.ejemplo.com"
 * - EVOLUTION_API_KEY: e.g. "token-secreto"
 * - EVOLUTION_INSTANCE: e.g. "agenda-loja"
 * - ADMIN_WHATSAPP_NUMBER: e.g. "593987654321" (formato internacional)
 */
export async function notificarNuevoEventoAdmin(datos: NotificacionEventoData): Promise<void> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE || "agenda";
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
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

  // Si no están configuradas las variables, emitimos log informativo sin romper el flujo
  if (!apiUrl || !apiKey || !adminNumber) {
    console.log("[NOTIFICACION WHATSAPP ADMIN - SIMULADA]");
    console.log(mensaje);
    return;
  }

  try {
    const formattedNumber = adminNumber.replace(/\D/g, "");
    const endpoint = `${apiUrl.replace(/\/$/, "")}/message/sendText/${instance}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: formattedNumber,
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
        "Error enviando WhatsApp a admin via Evolution API:",
        res.status,
        await res.text()
      );
    } else {
      console.log(`Notificación WhatsApp enviada exitosamente al admin (${formattedNumber})`);
    }
  } catch (error) {
    console.error("Fallo de red al enviar notificación WhatsApp:", error);
  }
}
