import "dotenv/config";
import { prisma } from "../lib/prisma";

async function testFull() {
  const lastUserMessage = "el 20 de septiembre?";
  const messages = [
    { sender: "bot", content: "¡Hola! Te doy la bienvenida a Loja." },
    { sender: "user", content: "hola?" },
    { sender: "bot", content: "Loja es una ciudad vibrante..." },
    { sender: "user", content: "Que puedo hacer mañana en Loja?" },
    { sender: "bot", content: "¡Hoy y esta semana tenemos grandes actividades..." },
    { sender: "user", content: "el 20 de septiembre?" },
  ];

  // Simular lógica de route.ts
  const fechaActualEcuador = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Guayaquil" }));
  const fechaHoyStr = fechaActualEcuador.toLocaleDateString("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const aliados = await prisma.aliado.findMany({ where: { activo: true }, take: 6 });
  const atractivos = await prisma.atractivoCantonal.findMany({ where: { activo: true }, take: 6 });
  const eventos = await prisma.evento.findMany({ where: { estado: "APROBADO" }, take: 8 });

  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  console.log("Invocando DeepSeek con historial completo...");
  const systemPrompt = `Eres el asistente virtual oficial de la "Agenda Cultural Loja" (Ecuador).
Hoy es: ${fechaHoyStr}.
Responde ÚNICAMENTE un objeto JSON válido con la estructura:
{
  "texto": "Tu respuesta...",
  "eventosRecomendadosIds": [],
  "aliadosRecomendadosIds": [],
  "atractivosRecomendadosIds": []
}`;

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.content || m.text || "",
        })),
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    }),
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Respuesta DeepSeek:", JSON.stringify(data, null, 2));
}

testFull().catch(console.error).finally(() => prisma.$disconnect());
