import { POST } from "../app/api/chat/route";
import { NextRequest } from "next/server";

async function run() {
  const req = new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { sender: "user", content: "el 25 de septiembre hay algo=" }
      ]
    })
  });

  const res = await POST(req);
  const data = await res.json();
  console.log("=== RESPUESTA PARA 25 DE SEPTIEMBRE ===");
  console.log("Texto:", data.texto);
  console.log("Eventos devueltos:", data.eventos.map((e: any) => ({ nombre: e.nombre, fecha: e.fecha })));
}

run().catch(console.error);
