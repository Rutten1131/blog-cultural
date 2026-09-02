import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validarTokenAprobacion } from "@/lib/tokensAprobacion";
import { revalidateAll } from "@/lib/actions/revalidate";

/**
 * GET /api/eventos/aprobar?id=123&token=abc...
 *
 * Endpoint de aprobación rápida con 1 clic desde WhatsApp.
 * Valida el token HMAC, aprueba el evento y devuelve una página HTML de confirmación.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const eventoId = Number(searchParams.get("id"));
  const token = searchParams.get("token") || "";

  // Validar parámetros básicos
  if (!eventoId || !token) {
    return respuestaHTML({
      titulo: "Enlace inválido",
      mensaje: "El enlace de aprobación no contiene los parámetros necesarios.",
      emoji: "❌",
      tipo: "error",
    });
  }

  // Buscar el evento
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    select: { id: true, slug: true, nombre: true, estado: true, lugar: true },
  });

  if (!evento) {
    return respuestaHTML({
      titulo: "Evento no encontrado",
      mensaje: `No se encontró ningún evento con ID ${eventoId}. Puede haber sido eliminado.`,
      emoji: "🔍",
      tipo: "error",
    });
  }

  // Validar token criptográfico
  const tokenValido = validarTokenAprobacion(evento.id, evento.slug, token);

  if (!tokenValido) {
    return respuestaHTML({
      titulo: "Acceso denegado",
      mensaje: "El token de aprobación no es válido. Este enlace puede haber sido alterado.",
      emoji: "🔒",
      tipo: "error",
    });
  }

  let appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.agendaculturalloja.com";
  if (appUrl.includes("agendacultural-loja.com")) {
    appUrl = appUrl.replace("agendacultural-loja.com", "agendaculturalloja.com");
  }

  // Si ya está aprobado, informar
  if (evento.estado === "APROBADO") {
    return respuestaHTML({
      titulo: "Evento ya aprobado",
      mensaje: `El evento "${evento.nombre}" ya fue aprobado previamente y está visible en la agenda pública.`,
      emoji: "ℹ️",
      tipo: "info",
      linkEvento: `${appUrl}/eventos/${evento.slug}`,
      linkAdmin: `${appUrl}/admin`,
    });
  }

  // Aprobar el evento
  await prisma.evento.update({
    where: { id: evento.id },
    data: { estado: "APROBADO" },
  });

  // Revalidar todas las rutas para que aparezca en la web pública
  revalidateAll();

  return respuestaHTML({
    titulo: "¡Evento Aprobado y Publicado!",
    mensaje: `El evento "${evento.nombre}" ya está visible en la Agenda Cultural de Loja.`,
    emoji: "✅",
    tipo: "success",
    linkEvento: `${appUrl}/eventos/${evento.slug}`,
    linkAdmin: `${appUrl}/admin`,
    nombreEvento: evento.nombre,
    lugarEvento: evento.lugar,
  });
}

/* ─── Generador de respuesta HTML visual ───────────────────── */

interface RespuestaHTMLParams {
  titulo: string;
  mensaje: string;
  emoji: string;
  tipo: "success" | "error" | "info";
  linkEvento?: string;
  linkAdmin?: string;
  nombreEvento?: string;
  lugarEvento?: string;
}

function respuestaHTML(params: RespuestaHTMLParams): NextResponse {
  const { titulo, mensaje, emoji, tipo, linkEvento, linkAdmin, nombreEvento, lugarEvento } = params;

  const colores = {
    success: { bg: "#f0fdf4", border: "#22c55e", accent: "#15803d", gradStart: "#22c55e", gradEnd: "#16a34a" },
    error:   { bg: "#fef2f2", border: "#ef4444", accent: "#dc2626", gradStart: "#ef4444", gradEnd: "#dc2626" },
    info:    { bg: "#eff6ff", border: "#3b82f6", accent: "#2563eb", gradStart: "#3b82f6", gradEnd: "#2563eb" },
  };
  const c = colores[tipo];

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} — Agenda Cultural Loja</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Manrope', system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #eeeef8 0%, #e8e0f0 100%);
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
      animation: slideUp 0.5s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card-header {
      background: linear-gradient(135deg, ${c.gradStart}, ${c.gradEnd});
      padding: 40px 32px;
      text-align: center;
    }
    .emoji {
      font-size: 64px;
      display: block;
      margin-bottom: 16px;
      animation: bounce 0.6s ease-out 0.3s both;
    }
    @keyframes bounce {
      0% { transform: scale(0); }
      60% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    .card-header h1 {
      color: white;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .card-body {
      padding: 32px;
    }
    .message {
      font-size: 15px;
      color: #52525b;
      line-height: 1.6;
      margin-bottom: 24px;
      text-align: center;
    }
    .event-info {
      background: ${c.bg};
      border: 1px solid ${c.border}30;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .event-info .name {
      font-weight: 800;
      color: #18181b;
      font-size: 16px;
      margin-bottom: 4px;
    }
    .event-info .lugar {
      font-size: 13px;
      color: #71717a;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      border-radius: 14px;
      font-family: 'Manrope', sans-serif;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, ${c.gradStart}, ${c.gradEnd});
      color: white;
      box-shadow: 0 4px 14px ${c.gradStart}40;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px ${c.gradStart}50;
    }
    .btn-secondary {
      background: #f4f4f5;
      color: #52525b;
    }
    .btn-secondary:hover {
      background: #e4e4e7;
    }
    .footer {
      text-align: center;
      padding: 0 32px 24px;
      font-size: 12px;
      color: #a1a1aa;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <span class="emoji">${emoji}</span>
      <h1>${titulo}</h1>
    </div>
    <div class="card-body">
      <p class="message">${mensaje}</p>
      ${nombreEvento ? `
      <div class="event-info">
        <p class="name">🎭 ${nombreEvento}</p>
        ${lugarEvento ? `<p class="lugar">📍 ${lugarEvento}</p>` : ""}
      </div>
      ` : ""}
      <div class="actions">
        ${linkEvento ? `<a href="${linkEvento}" class="btn btn-primary">🔗 Ver evento publicado</a>` : ""}
        ${linkAdmin ? `<a href="${linkAdmin}" class="btn btn-secondary">📋 Ir al Panel de Moderación</a>` : ""}
      </div>
    </div>
    <div class="footer">
      Agenda Cultural Loja — Descubre qué está pasando en Loja
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: tipo === "error" ? 403 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
