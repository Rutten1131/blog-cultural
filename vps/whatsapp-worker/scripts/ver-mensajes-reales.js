/**
 * Muestra mensajes REALES del grupo tal como los ve el bot.
 *
 * Para cada mensaje imprime:
 *   - el tipo de mensaje que reporta Evolution
 *   - de qué campo salió el texto
 *   - qué URLs encontró
 *   - si el bot lo procesó, lo ignoró o lo descartó
 *
 * SOLO LECTURA: no envía, no reacciona, no marca como leído.
 *
 * Uso (dentro del contenedor):
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/ver-mensajes-reales.js [cuantos]
 */

const { buscarMensajes, extraerTextoDeMensaje } = require("../lib/evolution-client");
const { extractUrls } = require("../lib/url-extractor");

const CUANTOS = Number(process.argv[2]) || 12;

/** Muestra la forma del mensaje sin exponer datos personales. */
function origenDelTexto(msg) {
  const m = msg?.message;
  if (!m) return "sin message";
  if (m.conversation) return "conversation";
  if (m.extendedTextMessage?.text) return "extendedTextMessage.text";
  if (m.imageMessage?.caption) return "imageMessage.caption";
  if (m.videoMessage?.caption) return "videoMessage.caption";
  if (m.documentMessage?.caption) return "documentMessage.caption";
  if (m.imageMessage) return "imageMessage SIN caption";
  if (m.videoMessage) return "videoMessage SIN caption";
  if (m.stickerMessage) return "stickerMessage";
  if (m.reactionMessage) return "reactionMessage";
  return Object.keys(m).join(", ") || "desconocido";
}

function rec(s, n) {
  if (!s) return "(vacío)";
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

async function main() {
  const grupos = (process.env.GRUPOS_SCRAPING || "").split(",").map((s) => s.trim()).filter(Boolean);

  if (grupos.length === 0) {
    console.error("GRUPOS_SCRAPING está vacío: no hay grupos que leer.");
    process.exit(1);
  }

  const jid = grupos[0];
  console.log(`Grupo: ${jid}`);
  console.log("");

  const data = await buscarMensajes(jid, 1, 50);
  const registros = data.registros || [];

  console.log(`Mensajes devueltos por Evolution: ${registros.length}`);
  console.log("(la API los da del más nuevo al más viejo; el bot los recorre al revés)");
  console.log("");

  // Se toma una muestra repartida para que no sean todos del mismo día.
  const paso = Math.max(1, Math.floor(registros.length / CUANTOS));
  const muestra = registros.filter((_, i) => i % paso === 0).slice(0, CUANTOS);

  for (const msg of muestra) {
    const tipo = msg.messageType || "(sin messageType)";
    const texto = extraerTextoDeMensaje(msg) || "";
    const urls = extractUrls(texto);
    const origen = origenDelTexto(msg);

    console.log("=".repeat(72));
    console.log(`messageType : ${tipo}`);
    console.log(`de          : ${rec(msg.pushName, 25)}`);
    console.log(`campo texto : ${origen}`);

    let veredicto;
    if (tipo === "reactionMessage" || tipo === "protocolMessage") {
      veredicto = "IGNORADO (ruido interno de WhatsApp)";
    } else if (!texto.trim()) {
      veredicto = "IGNORADO (sin texto que leer)";
    } else if (urls.length === 0) {
      veredicto = "IGNORADO (no trae enlaces)";
    } else {
      veredicto = `PROCESADO → ${urls.length} enlace(s)`;
    }
    console.log(`VEREDICTO   : ${veredicto}`);

    if (texto.trim()) {
      console.log("TEXTO       :");
      console.log(`  ${rec(texto, 400)}`);
    }

    for (const u of urls) console.log(`  → ${u}`);
    console.log("");
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
