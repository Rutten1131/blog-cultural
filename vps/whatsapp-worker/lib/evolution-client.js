/**
 * Cliente de Evolution API — SOLO LECTURA
 *
 * Este módulo NO envía mensajes, NO marca como leído, NO configura webhooks
 * y NO modifica ninguna instancia. Únicamente consulta datos.
 *
 * Se eligió leer por API en vez de usar webhooks porque la instancia
 * `cesar-comercial` ya tiene su webhook ocupado por otra aplicación
 * (http://127.0.0.1:8095/webhook/cliente) y pisarlo la rompería.
 */

const EVOLUTION_URL =
  process.env.EVOLUTION_API_URL || "http://178.238.238.158:8080";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "cesar-comercial";

/**
 * Llama a Evolution API y FALLA RUIDOSAMENTE si algo sale mal.
 *
 * (El código anterior imprimía "Webhook configurado" aunque Evolution
 * respondiera 400, lo que ocultó un problema real durante días.)
 */
async function evolutionFetch(path, options = {}) {
  const key = process.env.EVOLUTION_API_KEY;
  if (!key) {
    throw new Error("EVOLUTION_API_KEY no está configurada");
  }

  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    ...options,
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const texto = await res.text();

  if (!res.ok) {
    throw new Error(
      `Evolution ${path} → HTTP ${res.status}: ${texto.slice(0, 300)}`
    );
  }

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`Evolution ${path} → respuesta no es JSON: ${texto.slice(0, 200)}`);
  }
}

/** Comprueba la conexión y devuelve el estado de la instancia. */
async function estadoInstancia() {
  return evolutionFetch(`/instance/connectionState/${EVOLUTION_INSTANCE}`);
}

/** Lista los grupos visibles en la instancia (id + nombre). */
async function listarGrupos() {
  const grupos = await evolutionFetch(
    `/group/fetchAllGroups/${EVOLUTION_INSTANCE}?getParticipants=false`
  );

  if (!Array.isArray(grupos)) return [];

  return grupos.map((g) => ({
    jid: g.id,
    nombre: g.subject || "(sin nombre)",
    participantes: g.size ?? null,
  }));
}

/**
 * Lee mensajes de un chat/grupo, del más reciente hacia atrás.
 * @param {string} jid - identificador del grupo (termina en @g.us)
 * @param {number} page - página (1 = más recientes)
 * @param {number} offset - cantidad de mensajes por página
 */
async function buscarMensajes(jid, page = 1, offset = 50) {
  const data = await evolutionFetch(`/chat/findMessages/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    body: JSON.stringify({
      where: { key: { remoteJid: jid } },
      page,
      offset,
    }),
  });

  return {
    total: data?.messages?.total ?? 0,
    registros: data?.messages?.records ?? [],
  };
}

/**
 * Extrae el texto útil de un mensaje de WhatsApp.
 * Devuelve "" si es una reacción, un sticker o algo sin texto.
 */
function extraerTextoDeMensaje(msg) {
  const m = msg?.message;
  if (!m) return "";

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    ""
  );
}

/** URL de imagen adjunta al mensaje, si la hay (puede servir de portada). */
function extraerImagenDeMensaje(msg) {
  const m = msg?.message;
  if (!m) return null;

  const directa =
    m.imageMessage?.url ||
    m.videoMessage?.url ||
    m.documentWithCaptionMessage?.message?.documentMessage?.url ||
    null;

  return directa || null;
}

/** ¿Merece la pena procesar este mensaje? (descarta reacciones y ruido) */
function esMensajeRelevante(msg) {
  const tipo = msg?.messageType || "";
  if (tipo === "reactionMessage") return false;
  if (tipo === "protocolMessage") return false;
  if (tipo === "senderKeyDistributionMessage") return false;
  return true;
}

module.exports = {
  EVOLUTION_INSTANCE,
  evolutionFetch,
  estadoInstancia,
  listarGrupos,
  buscarMensajes,
  extraerTextoDeMensaje,
  extraerImagenDeMensaje,
  esMensajeRelevante,
};
