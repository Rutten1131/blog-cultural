/**
 * Re-alojamiento de imágenes en Bunny CDN
 *
 * POR QUÉ:
 *   Las URLs de imagen de Facebook e Instagram
 *   (`scontent-*.fbcdn.net`, `cdninstagram.com`) son enlaces firmados
 *   TEMPORALES que caducan en pocos días.
 *
 * DOS VÍAS DE DESCARGA:
 *   1. `bufferDirecto` — los bytes que ya bajó el navegador (Puppeteer)
 *      desde dentro de la propia página. Es la única forma que funciona
 *      con Instagram y Facebook, que devuelven HTTP 403 a un fetch normal.
 *   2. Descarga HTTP normal — para todo lo demás (webs, CDN abiertos).
 *
 * Reutiliza el mismo endpoint que `scripts/upload-images-to-cdn.ts`.
 */

const crypto = require("crypto");

const ZONA = process.env.BUNNY_STORAGE_ZONE;
const CLAVE = process.env.BUNNY_API_KEY;
const PULL = (process.env.BUNNY_PULL_ZONE_URL || "").replace(/\/$/, "");

// Solo aceptamos tipos de imagen reales: evita guardar una página HTML
// de error como si fuera una foto.
const TIPOS_PERMITIDOS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const TAMANO_MAXIMO = 12 * 1024 * 1024; // 12 MB

function configurado() {
  return Boolean(ZONA && CLAVE && PULL);
}

/** ¿La imagen ya está alojada en nuestro propio CDN? */
function yaEnCdn(url) {
  if (!url || !PULL) return false;
  return url.startsWith(PULL);
}

/**
 * Sube bytes ya validados a Bunny.
 * @returns {Promise<string|null>} URL pública, o null si no se pudo
 */
async function subirADisco(buffer, tipo, etiqueta) {
  const extension = TIPOS_PERMITIDOS[tipo];

  if (!extension) {
    console.warn(`[Imagen] Tipo no soportado (${tipo || "desconocido"}): no se sube`);
    return null;
  }

  if (buffer.length === 0) {
    console.warn("[Imagen] Los bytes vinieron vacíos");
    return null;
  }

  if (buffer.length > TAMANO_MAXIMO) {
    console.warn(
      `[Imagen] Demasiado grande (${(buffer.length / 1024 / 1024).toFixed(1)} MB): no se sube`
    );
    return null;
  }

  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 12);
  const ruta = `bot-whatsapp/${etiqueta}-${Date.now()}-${hash}.${extension}`;

  try {
    const res = await fetch(`https://storage.bunnycdn.com/${ZONA}/${ruta}`, {
      method: "PUT",
      headers: {
        AccessKey: CLAVE,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const detalle = (await res.text().catch(() => "")).slice(0, 150);
      console.warn(`[Imagen] Bunny respondió ${res.status}: ${detalle}`);
      return null;
    }

    return `${PULL}/${ruta}`;
  } catch (err) {
    console.warn(`[Imagen] Error subiendo a Bunny: ${err.message}`);
    return null;
  }
}

/**
 * Deja una imagen en nuestro CDN.
 *
 * Nunca lanza: si algo falla devuelve null y el post se guarda sin imagen,
 * en vez de romper todo el escaneo.
 *
 * @param {string} urlOriginal
 * @param {string} etiqueta - prefijo del nombre de archivo
 * @param {{base64: string, tipo: string}|null} bufferDirecto
 *        Bytes ya descargados por el navegador (vía preferente).
 * @returns {Promise<string|null>} URL permanente, o null
 */
async function rehospedarImagen(urlOriginal, etiqueta = "evento", bufferDirecto = null) {
  if (!configurado()) {
    console.warn(
      "[Imagen] Bunny no configurado (faltan BUNNY_*): la URL original puede caducar."
    );
    return null;
  }

  // ── Vía 1: los bytes que ya bajó el navegador ──
  if (bufferDirecto && typeof bufferDirecto.base64 === "string") {
    try {
      const buffer = Buffer.from(bufferDirecto.base64, "base64");
      const subida = await subirADisco(buffer, bufferDirecto.tipo, etiqueta);
      if (subida) {
        console.log(
          `[Imagen] Re-alojada desde el navegador (${(buffer.length / 1024).toFixed(0)} KB) → ${subida}`
        );
        return subida;
      }
      // Si falló, se intenta la vía normal como respaldo.
    } catch (err) {
      console.warn(`[Imagen] Buffer del navegador inválido: ${err.message}`);
    }
  }

  // ── Vía 2: descarga HTTP normal ──
  if (!urlOriginal || typeof urlOriginal !== "string") return null;
  if (yaEnCdn(urlOriginal)) return urlOriginal;

  try {
    const res = await fetch(urlOriginal, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AgendaCulturalLojaBot/1.0; +https://www.agendaculturalloja.com)",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      console.warn(
        `[Imagen] La descarga falló (HTTP ${res.status}): ${urlOriginal.slice(0, 90)}`
      );
      return null;
    }

    const tipo = (res.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    const buffer = Buffer.from(await res.arrayBuffer());
    const subida = await subirADisco(buffer, tipo, etiqueta);

    if (subida) {
      console.log(
        `[Imagen] Re-alojada (${(buffer.length / 1024).toFixed(0)} KB) → ${subida}`
      );
    }
    return subida;
  } catch (err) {
    console.warn(`[Imagen] Error re-alojando: ${err.message}`);
    return null;
  }
}

module.exports = { rehospedarImagen, subirADisco, configurado, yaEnCdn };
