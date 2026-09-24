/**
 * TEMPORAL — sondeo del endpoint de media de Evolution (SOLO LECTURA).
 *
 * Busca un mensaje real con imagen en los grupos configurados, pide su base64
 * y lo pasa por la visión, para confirmar la ruta, el cuerpo, la forma de la
 * respuesta y qué campos devuelve el afiche.
 *
 * NO escribe en la BD ni en Bunny. Solo llama a Evolution (lectura) y a Gemini.
 *
 *   cd /root/whatsapp-worker && docker compose run --rm \
 *     --entrypoint node whatsapp-worker /app/scripts/tmp-sondeo-media.js
 */
require("dotenv").config({ path: "./.env" });
const {
  buscarMensajes,
  evolutionFetch,
  EVOLUTION_INSTANCE,
} = require("/app/lib/evolution-client");
const { leerAfiche, configurado: visionConfigurada } = require("/app/lib/vision");

const grupos = (process.env.GRUPOS_SCRAPING || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corto = (t, n) => (t ? String(t).replace(/\s+/g, " ").slice(0, n) : "—");

/** Igual que la función que se va a añadir a evolution-client.js. */
async function descargarMedia(msg) {
  const r = await evolutionFetch(
    `/chat/getBase64FromMediaMessage/${EVOLUTION_INSTANCE}`,
    {
      method: "POST",
      body: JSON.stringify({ message: { key: msg.key }, convertToMp4: false }),
    }
  );
  return r;
}

(async () => {
  console.log(`Visión configurada: ${visionConfigurada() ? "sí" : "NO"}`);
  console.log(`Grupos: ${grupos.length}\n`);

  // ── 1. Buscar un mensaje con imagen ──
  let candidato = null;
  const encontrados = [];

  for (const jid of grupos) {
    let data;
    try {
      data = await buscarMensajes(jid, 1, 50);
    } catch (err) {
      console.log(`[${jid}] error leyendo mensajes: ${err.message}`);
      continue;
    }
    const registros = data.registros || [];
    console.log(`[${jid}] ${registros.length} mensajes leídos`);

    for (const msg of registros) {
      const m = msg?.message || {};
      if (m.imageMessage) {
        const info = {
          grupo: jid,
          key: msg.key,
          messageType: msg.messageType,
          mimetype: m.imageMessage.mimetype,
          fileLength: m.imageMessage.fileLength,
          caption: m.imageMessage.caption,
          pushName: msg.pushName,
        };
        encontrados.push(info);
        if (!candidato) candidato = info;
      }
    }
  }

  console.log(`\n=== MENSAJES CON IMAGEN ENCONTRADOS: ${encontrados.length} ===`);
  for (const e of encontrados.slice(0, 8)) {
    console.log(
      `· id ${String(e.key?.id).slice(0, 18)}… · ${e.messageType} · ${e.mimetype} · ` +
        `${e.fileLength ?? "?"} bytes · de ${e.pushName || "?"} · caption: ${corto(e.caption, 40)}`
    );
  }

  if (!candidato) {
    console.log("\nNo hay ningún imageMessage en la ventana de 50 mensajes. Nada que sondear.");
    return;
  }

  // ── 2. Pedir el base64 ──
  console.log(`\n=== PROBANDO ${"/chat/getBase64FromMediaMessage/" + EVOLUTION_INSTANCE} ===`);
  console.log(`key: ${JSON.stringify(candidato.key)}`);

  let respuesta = null;
  try {
    respuesta = await descargarMedia({ key: candidato.key });
  } catch (err) {
    console.log(`❌ La llamada falló: ${err.message}`);
    console.log("\n=> La ruta o el cuerpo NO son los esperados. Hay que ajustarlos antes de seguir.");
    return;
  }

  console.log(`Claves de la respuesta: ${Object.keys(respuesta || {}).join(", ") || "(vacía)"}`);

  // Distintas versiones de Evolution envuelven la respuesta de otra forma.
  const base64Crudo =
    respuesta?.base64 || respuesta?.data?.base64 || respuesta?.media || null;
  const mimetype =
    respuesta?.mimetype || respuesta?.data?.mimetype || candidato.mimetype || "image/jpeg";

  if (!base64Crudo) {
    console.log("❌ No vino base64 en la respuesta. Revisar la forma del JSON.");
    console.log(JSON.stringify(respuesta).slice(0, 400));
    return;
  }

  const tienePrefijo = base64Crudo.startsWith("data:");
  const base64 = tienePrefijo ? base64Crudo.split(",")[1] : base64Crudo;
  console.log(
    `✅ base64 recibido: ${base64.length} caracteres (~${Math.round((base64.length * 0.75) / 1024)} KB) · ` +
      `mimetype: ${mimetype} · prefijo 'data:': ${tienePrefijo ? "SÍ (hay que quitarlo)" : "no"}`
  );

  // ── 3. Pasarlo por la visión ──
  if (!visionConfigurada()) {
    console.log("\n(La visión no está configurada: no se puede probar la lectura del afiche)");
    return;
  }

  console.log("\n=== LEYENDO EL AFICHE CON GEMINI ===");
  const afiche = await leerAfiche([{ base64, tipo: mimetype }]);

  if (!afiche) {
    console.log("❌ leerAfiche devolvió null (no se pudo leer, o ningún formato válido)");
    return;
  }

  console.log("✅ El afiche se leyó. Campos devueltos:");
  for (const [k, v] of Object.entries(afiche)) {
    console.log(`  ${k}: ${typeof v === "string" ? corto(v, 90) : JSON.stringify(v)}`);
  }
})().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
