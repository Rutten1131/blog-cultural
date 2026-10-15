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

/**
 * Recorta un cuadro (cuadrícula/bloque) de una imagen base64 y lo sube a Bunny CDN.
 *
 * @param {{ base64: string, tipo: string }} imgObj - Imagen original con base64 y tipo MIME
 * @param {{ top: number, left: number, width: number, height: number }} cuadro - Coordenadas porcentuales (0-100)
 * @param {string} etiqueta - Prefijo para el archivo
 * @returns {Promise<string|null>} URL de la imagen recortada subida a CDN
 */
async function recortarYSubirCuadro(imgObj, cuadro, etiqueta) {
  if (!imgObj || !imgObj.base64) return null;

  // Si el cuadro abarca prácticamente toda la imagen, no recortar
  if (
    !cuadro ||
    (cuadro.top <= 2 && cuadro.left <= 2 && cuadro.width >= 96 && cuadro.height >= 96)
  ) {
    const buffer = Buffer.from(imgObj.base64, "base64");
    return await subirADisco(buffer, imgObj.tipo || "image/jpeg", etiqueta);
  }

  try {
    let sharp;
    try {
      sharp = require("sharp");
    } catch {
      console.warn("[Imagen] sharp no está disponible, usando imagen completa");
      const buffer = Buffer.from(imgObj.base64, "base64");
      return await subirADisco(buffer, imgObj.tipo || "image/jpeg", etiqueta);
    }

    const bufferOriginal = Buffer.from(imgObj.base64, "base64");
    const metadata = await sharp(bufferOriginal).metadata();
    const origW = metadata.width;
    const origH = metadata.height;

    if (!origW || !origH) {
      return await subirADisco(bufferOriginal, imgObj.tipo || "image/jpeg", etiqueta);
    }

    // Calcular píxeles a partir de porcentajes (con margen de seguridad)
    const leftPx = Math.max(0, Math.floor((cuadro.left / 100) * origW));
    const topPx = Math.max(0, Math.floor((cuadro.top / 100) * origH));
    const widthPx = Math.min(origW - leftPx, Math.floor((cuadro.width / 100) * origW));
    const heightPx = Math.min(origH - topPx, Math.floor((cuadro.height / 100) * origH));

    if (widthPx < 100 || heightPx < 100) {
      console.warn("[Imagen] Cuadro de recorte demasiado pequeño, usando imagen original");
      return await subirADisco(bufferOriginal, imgObj.tipo || "image/jpeg", etiqueta);
    }

    console.log(
      `[Imagen] ✂️ Recortando evento individual: [${leftPx}, ${topPx}, ${widthPx}x${heightPx}] de ${origW}x${origH}`
    );

    const bufferRecortado = await sharp(bufferOriginal)
      .extract({ left: leftPx, top: topPx, width: widthPx, height: heightPx })
      .jpeg({ quality: 90 })
      .toBuffer();

    const subida = await subirADisco(bufferRecortado, "image/jpeg", `${etiqueta}-crop`);
    if (subida) {
      console.log(
        `[Imagen] 🎯 Recorte individual subido a CDN (${(bufferRecortado.length / 1024).toFixed(0)} KB) → ${subida}`
      );
      return subida;
    }
  } catch (err) {
    console.warn(`[Imagen] Error al recortar imagen con sharp: ${err.message}`);
  }

  // Fallback: subir lámina completa si falla el recorte
  const bufferFallback = Buffer.from(imgObj.base64, "base64");
  return await subirADisco(bufferFallback, imgObj.tipo || "image/jpeg", etiqueta);
}

module.exports = { rehospedarImagen, recortarYSubirCuadro, subirADisco, configurado, yaEnCdn };

