import { prisma } from "@/lib/prisma";

export interface ContextoChat {
  resumen: string | null;
  mensajesRecientes: Array<{
    sender: string;
    contenido: string;
    createdAt: Date;
  }>;
  totalMensajes: number;
}

/**
 * Obtiene el contexto de memoria del chat:
 * 1. Resumen acumulado previo (si existe)
 * 2. Últimos 10 mensajes ordenados cronológicamente
 */
export async function obtenerMemoriaSesion(sessionId: string): Promise<ContextoChat> {
  try {
    const sesion = await prisma.chatSession.findUnique({
      where: { sessionId },
      select: {
        totalMensajes: true,
        contextoResumen: true,
      },
    });

    const mensajes = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        sender: true,
        contenido: true,
        createdAt: true,
      },
    });

    // Invertir para tener orden cronológico (antiguo -> nuevo)
    const mensajesRecientes = mensajes.reverse();

    return {
      resumen: sesion?.contextoResumen || null,
      mensajesRecientes,
      totalMensajes: sesion?.totalMensajes || 0,
    };
  } catch (error) {
    console.error("[ChatMemory] Error obteniendo memoria:", error);
    return {
      resumen: null,
      mensajesRecientes: [],
      totalMensajes: 0,
    };
  }
}

/**
 * Genera y actualiza asíncronamente el resumen si la conversación supera los 10 mensajes.
 * Comprime los mensajes anteriores manteniendo preferencias del usuario, nombres de lugares/hoteles
 * y acuerdos previos para que el bot nunca pierda el hilo.
 */
export async function sincronizarResumenSiCorresponde(sessionId: string): Promise<void> {
  try {
    const sesion = await prisma.chatSession.findUnique({
      where: { sessionId },
      select: {
        totalMensajes: true,
        contextoResumen: true,
      },
    });

    if (!sesion || sesion.totalMensajes <= 10) {
      return;
    }

    // Traer todos los mensajes excepto los últimos 10
    const mensajesAntiguos = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: {
        sender: true,
        contenido: true,
      },
    });

    // Si hay más de 10 mensajes, tomamos los que quedan fuera de la ventana deslizante reciente
    if (mensajesAntiguos.length <= 10) return;
    const paraSintetizar = mensajesAntiguos.slice(0, mensajesAntiguos.length - 10);

    const transcripcion = paraSintetizar
      .map((m) => `${m.sender === "user" ? "Usuario" : "Bot"}: ${m.contenido}`)
      .join("\n");

    const promptResumen = `Eres un asistente que sintetiza memoria conversacional para un chatbot turístico y cultural de Loja, Ecuador.
Sintetiza la siguiente conversación en un párrafo conciso (máximo 4 líneas) resaltando:
1. Qué busca el usuario (eventos, hoteles, comida, lugares, fechas mencionadas).
2. Qué aliados, hoteles o eventos se le recomendaron o mostraron interés.
3. Si ya se acordó algo o se pasó a WhatsApp.

Resumen previo (si había): ${sesion.contextoResumen || "Ninguno"}

Nuevos mensajes anteriores a resumir:
${transcripcion}

Escribe ÚNICAMENTE el párrafo de resumen actualizado:`;

    const apiKey = process.env.GROQ_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return;

    let nuevoResumen = "";
    if (process.env.DEEPSEEK_API_KEY) {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: promptResumen }],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        nuevoResumen = data.choices?.[0]?.message?.content?.trim() || "";
      }
    } else if (process.env.GROQ_API_KEY) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptResumen }],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        nuevoResumen = data.choices?.[0]?.message?.content?.trim() || "";
      }
    }

    if (nuevoResumen) {
      await prisma.chatSession.update({
        where: { sessionId },
        data: { contextoResumen: nuevoResumen },
      });
    }
  } catch (error) {
    console.error("[ChatMemory] Error sintetizando memoria:", error);
  }
}
