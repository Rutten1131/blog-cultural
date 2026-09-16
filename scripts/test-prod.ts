import "dotenv/config";
import { prisma } from "../lib/prisma";

async function testFullRoute() {
  const messages = [
    { sender: "bot", content: "¡Hola! Te doy la bienvenida a Loja." },
    { sender: "user", content: "hola?" },
  ];

  const res = await fetch("https://www.agendaculturalloja.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  console.log("Status en producción:", res.status);
  const data = await res.json();
  console.log("Respuesta de producción:", JSON.stringify(data, null, 2));
}

testFullRoute().catch(console.error);
