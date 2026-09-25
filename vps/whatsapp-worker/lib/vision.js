/**
 * Lectura de afiches con visión artificial (Google Gemini)
 *
 * POR QUÉ:
 *   En los afiches de Instagram y Facebook está TODA la información del
 *   evento (fecha, hora, lugar, precio) pero en forma de imagen. Puppeteer
 *   baja la imagen, pero no "lee" lo que dice. Gemini sí.
 *
 * POR QUÉ VARIAS KEYS Y VARIOS MODELOS:
 *   Los modelos flash de Gemini se saturan seguido (HTTP 503) y el cupo
 *   gratuito se agota (HTTP 429). Se rota entre keys y modelos hasta que
 *   alguno responda.
 *
 * REGLA DE ORO:
 *   Esta función NUNCA lanza. Si todo falla devuelve null y el post se
 *   guarda igual, sin los datos del afiche. El escaneo nunca se interrumpe.
 *
 * POR QUÉ SE PIDE EL TEXTO LITERAL DE LA FECHA:
 *   En vez de pedirle a Gemini una fecha ya convertida, se le pide el texto
 *   tal como aparece ("Sábado 4 de octubre"). La normalización (año, zona
 *   horaria de Loja) la hace `fechas-es.js`, que ya está probado. Así la
 *   lógica de fechas vive en un solo lugar.
 */

const KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Orden de preferencia. El "flash-lite" resultó el más estable para
// imágenes (los "flash" daban 503 seguido). Verificado 2026-09-24.
const MODELOS = (
  process.env.GEMINI_MODELOS ||
  "gemini-flash-lite-latest,gemini-3.6-flash,gemini-flash-latest,gemini-3.5-flash"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const TIMEOUT_MS = 90000;

const PROMPT = `Sos un asistente que extrae datos de afiches de eventos culturales en Loja, Ecuador.

Mirá las imágenes (pueden ser las varias páginas de un mismo afiche o carrusel de Instagram/Facebook) y extraé los datos del evento que anuncian.

REGLAS ESTRICTAS — son lo más importante:
- Extraé SOLO lo que sea visible en las imágenes.
- Si un dato NO aparece, devolvé null. NO lo inventes ni lo deduzcas.
- NO completes el año si no está escrito. Copiá la fecha TAL COMO aparece.
- Si el contenido claramente NO anuncia un evento cultural, pon esEventoCultural en false.
- TÍTULO LIMPIO: Devolvé el título artístico y conciso del evento (ej: "Boleros, Pasillos y Algo Más", "Exposición Pictórica Entre lo Concreto y lo Invisible"). NUNCA incluyas prefijos como "Loja es Arte y Cultura on Instagram", "Gracias a la nota de...", "Última hora", etc.
- ORGANIZADOR REAL: Identificá la institución o grupo que organiza o presenta el evento (ej: "Municipio de Loja", "Casa de la Cultura Ecuatoriana Núcleo de Loja", "Rondalla Municipal", "Grupo Arupo", o el nombre de los artistas). NUNCA pongas nombres de medios de comunicación o prensa (como "Primer Reporte", "Hora32", "Diario La Crónica", "Ecotel Press", etc.) como organizador.
- MEDIOS DE COMUNICACIÓN / NOTICIAS: Si la imagen tiene marcos, banners o marcas de agua de medios de prensa o noticias (ej: "Primer Reporte", "Hora32"), marcalo en "esPlantillaPrensa": true y "nombreMedioPrensa": "nombre del medio".
- MEJOR ÍNDICE DE AFICHE: Si hay varias imágenes (carrusel), indicá en "indiceMejorAfiche" (índice base 0) cuál imagen es el afiche limpio/artístico principal donde están la fecha, el lugar y el título del evento.
- En "categoriaSugerida", elegí una de estas exactamente: ["Arte y exposiciones", "Teatro", "Música", "Ferias", "Artes Vivas"] o null.
- En "zonaSugerida", elegí una de las parroquias de Loja si se menciona o reconoce el lugar (Urbanas: "El Sagrario", "Sucre", "El Valle", "San Sebastián", "Punzara", "Carigán"; Rurales: "Chantaco", "Chuquiribamba", "El Cisne", "Gualel", "Jimbilla", "Malacatos", "Quinara", "San Lucas", "San Pedro de Vilcabamba", "Santiago", "Taquil", "Vilcabamba", "Yangana") o null.

Respondé ÚNICAMENTE con este JSON, sin texto adicional ni bloques de código:
{
  "esEventoCultural": true,
  "nombre": "nombre conciso y limpio del evento, o null",
  "organizador": "institución, artista o gestor real del evento (no prensa), o null",
  "esPlantillaPrensa": false,
  "nombreMedioPrensa": "Primer Reporte | Hora32 | null",
  "indiceMejorAfiche": 0,
  "fechaTexto": "la fecha de inicio copiada tal cual aparece escrita, o null",
  "horaTexto": "la hora tal como aparece, o null",
  "fechaFinTexto": "si dice hasta cuándo dura, o null",
  "lugar": "dónde se realiza (ej: Teatro Bolívar, Casona Cultural), o null",
  "precio": "precio o entrada, o null",
  "telefonoContacto": "número de WhatsApp o teléfono de contacto o reservas si aparece en el afiche (ej: 0991234567), o null",
  "categoriaSugerida": "Música | Teatro | Ferias | Artes Vivas | Arte y exposiciones | null",
  "zonaSugerida": "nombre de la parroquia de Loja si corresponde | null",
  "textoDelAfiche": "todo el texto legible del afiche (sin logos de noticias), o null"
}`;

function configurado() {
  return KEYS.length > 0;
}

/**
 * Formatos de imagen que Gemini acepta.
 *
 * Importante: `image/avif` NO está soportado (Instagram se lo sirve a Chrome
 * cuando el navegador dice aceptarlo). Si se manda, la API responde HTTP 400
 * y se pierde la lectura del afiche completo.
 */
const FORMATOS_VALIDOS = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** Deja solo las imágenes que la API va a aceptar. */
function imagenesValidas(imagenes) {
  return (imagenes || []).filter((i) => {
    if (!i || !i.base64) return false;
    const tipo = String(i.tipo || "").toLowerCase().split(";")[0].trim();
    return FORMATOS_VALIDOS.has(tipo);
  });
}

/** Quita los ```json ... ``` con que a veces envuelve la respuesta. */
function limpiarJson(texto) {
  return texto
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

/** Una tentativa con una key y un modelo concretos. */
async function intentar(key, modelo, imagenes) {
  const partes = [{ text: PROMPT }];

  for (const img of imagenes) {
    partes.push({ inline_data: { mime_type: img.tipo, data: img.base64 } });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ parts: partes }],
        generationConfig: { temperature: 0 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }
  );

  const crudo = await res.text();

  // 429 = cupo agotado, 503 = saturado. En ambos casos conviene probar
  // otra combinación en vez de rendirse.
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`);
    error.reintentable = res.status === 429 || res.status === 503;
    error.detalle = crudo.slice(0, 400);
    throw error;
  }

  let data;
  try {
    data = JSON.parse(crudo);
  } catch {
    throw new Error("La respuesta no es JSON válido");
  }

  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) {
    throw new Error("La respuesta no trae texto");
  }

  let limpio;
  try {
    limpio = JSON.parse(limpiarJson(texto));
  } catch {
    throw new Error(`No se pudo interpretar el JSON devuelto: ${texto.slice(0, 200)}`);
  }

  return limpio;
}

/**
 * Lee un afiche (una o varias imágenes del mismo post).
 *
 * @param {Array<{base64: string, tipo: string}>} imagenes
 * @returns {Promise<Object|null>} Datos leídos, o null si no se pudo
 */
async function leerAfiche(imagenes) {
  if (!configurado()) {
    console.warn("[Visión] Sin GEMINI_API_KEYS configuradas: no se leen los afiches");
    return null;
  }

  if (!Array.isArray(imagenes) || imagenes.length === 0) return null;

  // Se descartan los formatos que la API no acepta (por ejemplo image/avif),
  // porque provocan un HTTP 400 que tumba la lectura completa.
  const utiles = imagenesValidas(imagenes);
  if (utiles.length === 0) {
    const tipos = [...new Set((imagenes || []).map((i) => i.tipo))].join(", ");
    console.warn(`[Visión] Ningún formato aceptado por la API (recibidos: ${tipos})`);
    return null;
  }
  if (utiles.length < imagenes.length) {
    console.warn(
      `[Visión] Se descartan ${imagenes.length - utiles.length} imagen/es de formato no soportado`
    );
  }
  imagenes = utiles;

  const pesoKB = Math.round(
    imagenes.reduce((a, i) => a + (i.base64?.length ?? 0), 0) * 0.75 / 1024
  );

  const errores = [];

  for (let k = 0; k < KEYS.length; k++) {
    for (const modelo of MODELOS) {
      const etiqueta = `key#${k + 1} + ${modelo}`;
      const inicio = Date.now();

      try {
        const resultado = await intentar(KEYS[k], modelo, imagenes);

        if (!resultado || typeof resultado !== "object") {
          throw new Error("respuesta vacía");
        }

        console.log(
          `[Visión] Afiche leído con ${etiqueta} en ${((Date.now() - inicio) / 1000).toFixed(1)}s ` +
            `(${imagenes.length} imagen/es, ${pesoKB} KB)`
        );

        return resultado;
      } catch (err) {
        errores.push(`${etiqueta}: ${err.message}`);

        // Si el problema es de red o de contenido, no sirve insistir con
        // otra key: se corta y se devuelve null.
        if (!err.reintentable && !/HTTP 5\d\d/.test(err.message)) {
          console.warn(`[Visión] ${etiqueta} → ${err.message} (no reintentable)`);
          if (err.detalle) console.warn(`[Visión]   detalle: ${err.detalle}`);
          console.warn(`[Visión] No se leerá el afiche de este post.`);
          return null;
        }

        console.warn(`[Visión] ${etiqueta} → ${err.message} — probando la siguiente`);
      }
    }
  }

  console.warn(`[Visión] Ninguna combinación funcionó. Intentos: ${errores.length}`);
  return null;
}

module.exports = { leerAfiche, imagenesValidas, configurado, MODELOS, PROMPT };
