/**
 * TEST: Publicacion inmediata en Facebook e Instagram - Agenda Cultural Loja
 *
 * Uso:
 *   node scripts/test-redes-sociales.js              <- toma el ultimo evento APROBADO con imagen
 *   node scripts/test-redes-sociales.js --id=123     <- evento especifico por ID
 *   node scripts/test-redes-sociales.js --en=5       <- publica en 5 minutos (default 2)
 *
 * Por defecto: busca el ultimo evento APROBADO con imagen y lo publica en 2 minutos.
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

// Conexion a BD
const u = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: u.hostname,
  port: Number(u.port) || 3306,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: decodeURIComponent(u.pathname.replace(/^\//, "")),
});
const prisma = new PrismaClient({ adapter });

// Configuracion del Webhook
const WEBHOOK_URL =
  process.env.REDES_SOCIALES_WEBHOOK_URL ||
  "https://redes-sociales-l5q4.vercel.app/api/external/agenda-cultural/schedule";
const API_KEY =
  process.env.REDES_SOCIALES_API_KEY ||
  process.env.AGENDA_CULTURAL_API_KEY ||
  "agenda_sec_7f9b2c3e1a4d85206";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.agendaculturalloja.com";

// Argumentos CLI
const args = process.argv.slice(2);
const argId = args.find((a) => a.startsWith("--id="));
const eventoIdForzado = argId ? Number(argId.split("=")[1]) : null;
const argEn = args.find((a) => a.startsWith("--en="));
const minutosAdelanto = argEn ? Number(argEn.split("=")[1]) : 2;

// Caption Builder
function construirCaption(ev) {
  const fecha = new Date(ev.fecha);
  const fechaStr = fecha.toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Guayaquil",
  });
  const horaStr = fecha.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Guayaquil",
  });
  const catTag =
    ev.categoria && ev.categoria.nombre
      ? "#" + ev.categoria.nombre.replace(/[^a-zA-Z0-9\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1]/g, "")
      : "#CulturaLoja";
  const desc =
    ev.descripcion.length > 280
      ? ev.descripcion.substring(0, 277) + "..."
      : ev.descripcion;
  const webUrl = APP_URL + "/eventos/" + ev.slug;

  return (
    "\uD83C\uDFAD " + ev.nombre + "\n\n" +
    "\uD83D\uDCCD Lugar: " + ev.lugar + "\n" +
    "\uD83D\uDCC5 Fecha: " + fechaStr + "\n" +
    "\u23F0 Hora: " + horaStr + "\n\n" +
    desc + "\n\n" +
    "\uD83D\uDD17 Mas detalles y ubicacion:\n" + webUrl + "\n\n" +
    "#AgendaCultural #Loja #CulturaLoja #EventosLoja " + catTag
  );
}

async function main() {
  console.log("\n\u2550".repeat(50));
  console.log("  TEST PUBLICACION REDES SOCIALES - Agenda Cultural");
  console.log("\u2550".repeat(50) + "\n");

  // 1) Buscar evento
  let evento;
  if (eventoIdForzado) {
    evento = await prisma.evento.findUnique({
      where: { id: eventoIdForzado },
      include: { categoria: true, zona: true },
    });
    if (!evento) {
      console.error("ERROR: No existe ningun evento con ID " + eventoIdForzado);
      await prisma.$disconnect();
      process.exit(1);
    }
  } else {
    evento = await prisma.evento.findFirst({
      where: { estado: "APROBADO", imagenUrl: { not: null } },
      orderBy: { createdAt: "desc" },
      include: { categoria: true, zona: true },
    });
  }

  if (!evento) {
    console.error("ERROR: No hay eventos APROBADOS con imagen en la base de datos.");
    console.error("Aprueba un evento desde /admin primero.");
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("Evento seleccionado:");
  console.log("  ID      : " + evento.id);
  console.log("  Nombre  : " + evento.nombre);
  console.log("  Lugar   : " + evento.lugar);
  console.log("  Estado  : " + evento.estado);
  console.log("  Imagen  : " + evento.imagenUrl);
  console.log("  Categoria: " + (evento.categoria ? evento.categoria.nombre : "Sin categoria"));
  console.log("  Fecha evento: " + new Date(evento.fecha).toLocaleString("es-EC", { timeZone: "America/Guayaquil" }));

  // 2) scheduledAt = ahora + minutosAdelanto
  const scheduledAt = new Date(Date.now() + minutosAdelanto * 60 * 1000).toISOString();
  console.log("\nSe publicara en: " + minutosAdelanto + " minutos");
  console.log("scheduledAt: " + scheduledAt);

  // 3) Armar payload
  const caption = construirCaption(evento);

  let multimediaArray = [];
  if (Array.isArray(evento.multimedia)) {
    multimediaArray = evento.multimedia.filter(
      (url) => typeof url === "string" && url.trim().length > 0
    );
  }

  let payload;
  let tipo;

  if (evento.videoUrl && evento.videoUrl.endsWith(".mp4")) {
    tipo = "REEL";
    payload = { caption, mediaUrl: evento.videoUrl, type: "REEL", scheduledAt, platforms: ["FACEBOOK", "INSTAGRAM"], secret: API_KEY };
  } else if (multimediaArray.length > 1) {
    tipo = "CAROUSEL";
    payload = { caption, type: "CAROUSEL", mediaItems: multimediaArray.map((url) => ({ url, type: "IMAGE" })), scheduledAt, platforms: ["FACEBOOK", "INSTAGRAM"], secret: API_KEY };
  } else {
    tipo = "FEED_POST";
    payload = { caption, mediaUrl: evento.imagenUrl, type: "FEED_POST", scheduledAt, platforms: ["FACEBOOK", "INSTAGRAM"], secret: API_KEY };
  }

  console.log("\nTipo de publicacion: " + tipo);
  console.log("\nCaption que se publicara:");
  console.log("-".repeat(50));
  console.log(caption);
  console.log("-".repeat(50));

  // 4) Enviar al webhook
  console.log("\nEnviando al webhook: " + WEBHOOK_URL + "\n");

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "User-Agent": "AgendaCulturalLoja-TestScript/1.0",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    let responseJson = null;
    try { responseJson = JSON.parse(responseText); } catch (_) {}

    if (res.ok) {
      console.log("EXITO! La publicacion fue programada correctamente.\n");
      if (responseJson) {
        console.log("Respuesta del servidor:");
        console.log(JSON.stringify(responseJson, null, 2));
      } else {
        console.log("Respuesta: " + responseText);
      }
      console.log("\n" + "=".repeat(50));
      console.log("PRUEBA EXITOSA");
      console.log("En ~" + minutosAdelanto + " minutos revisa tu Facebook e Instagram");
      console.log("de Agenda Cultural y veras la publicacion publicada.");
      console.log("=".repeat(50) + "\n");
    } else {
      console.error("ERROR del webhook (HTTP " + res.status + "):");
      console.error(responseText);
    }
  } catch (err) {
    console.error("Error de red al conectar con el webhook:");
    console.error(err.message);
    console.log("\nURL configurada: " + WEBHOOK_URL);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  prisma.$disconnect();
  process.exit(1);
});
