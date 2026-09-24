/**
 * Re-alojamiento de imágenes en Bunny CDN
 *
 * POR QUÉ:
 *   Las URLs de imagen de Facebook e Instagram
 *   (`scontent-*.fbcdn.net`, `cdninstagram.com`) son enlaces firmados
 *   TEMPORALES que caducan en pocos días. Si se guardan tal cual, la
 *   imagen del evento se rompe poco después de publicarlo.
 *
 * SOLUCIÓN:
 *   Al detectar el post, se descarga la imagen y se sube a Bunny (el
 *   mismo CDN que ya usa el proyecto), guardando la URL permanente.
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
 * Descarga una imagen remota y la sube a Bunny CDN.
 *
 * Nunca lanza: si algo falla devuelve null y el post se guarda sin
 * imagen, en vez de romper todo el escaneo.
 *
 * @param {string} urlOriginal
 * @param {string} etiqueta - prefijo del nombre de archivo
 * @returns {Promise<string|null>} URL permanente, o null si no se pudo
 */
async function rehospedarImagen(urlOriginal, etiqueta = "evento") {
  if (!urlOriginal || typeof urlOriginal !== "string") return null;

  // Ya es nuestra: no hay nada que hacer.
  if (yaEnCdn(urlOriginal)) return urlOriginal;

  if (!configurado()) {
    console.warn(
      "[Imagen] Bunny no configurado (faltan BUNNY_*): se deja la URL original, que puede caducar."
    );
    return null;
  }

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

    const extension = TIPOS_PERMITIDOS[tipo];
    if (!extension) {
      console.warn(
        `[Imagen] Tipo no soportado (${tipo || "desconocido"}): no se re-aloja`
      );
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length === 0) {
      console.warn("[Imagen] La imagen vino vacía");
      return null;
    }

    if (buffer.length > TAMANO_MAXIMO) {
      console.warn(
        `[Imagen] Demasiado grande (${(buffer.length / 1024 / 1024).toFixed(1)} MB): no se re-aloja`
      );
      return null;
    }

    // Nombre estable: permite detectar duplicados y cachear bien.
    const hash = crypto
      .createHash("sha1")
      .update(buffer)
      .digest("hex")
      .slice(0, 12);

    const ruta = `bot-whatsapp/${etiqueta}-${Date.now()}-${hash}.${extension}`;

    const subida = await fetch(
      `https://storage.bunnycdn.com/${ZONA}/${ruta}`,
      {
        method: "PUT",
        headers: {
          AccessKey: CLAVE,
          "Content-Type": "application/octet-stream",
        },
        body: new Uint8Array(buffer),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!subida.ok) {
      const detalle = (await subida.text().catch(() => "")).slice(0, 150);
      console.warn(`[Imagen] Bunny respondió ${subida.status}: ${detalle}`);
      return null;
    }

    const publica = `${PULL}/${ruta}`;
    console.log(
      `[Imagen] Re-alojada (${(buffer.length / 1024).toFixed(0)} KB) → ${publica}`
    );
    return publica;
  } catch (err) {
    console.warn(`[Imagen] Error re-alojando: ${err.message}`);
    return null;
  }
}

module.exports = { rehospedarImagen, configurado, yaEnCdn };
