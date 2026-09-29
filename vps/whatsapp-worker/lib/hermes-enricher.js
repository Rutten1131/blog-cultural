/**
 * Hermes Enricher — Agenda Cultural Loja
 *
 * Enriquece los datos de un evento CON DATOS REALES (nombre, lugar, fecha, descripción)
 * usando LLM (Groq / Gemini / DeepSeek) para generar:
 *   1. Slug SEO optimizado (palabras clave reales de búsqueda en Ecuador)
 *   2. Descripción SEO enriquecida (semántica local, sin inventar datos)
 *   3. Copy de Instagram optimizado para guardados y compartidos
 *   4. Copy de Facebook con llamado a la acción
 *   5. Hook visual "thumb-stopping" para el primer mensaje
 *
 * PRINCIPIO (Constitución Hermes):
 * - Hermes NO inventa datos (lugares, fechas u horarios falsos).
 * - Si el LLM no responde o falla, usa el fallback estructurado sin interrumpir el flujo.
 */

const https = require("https");
let GroqSDK = null;
try {
  GroqSDK = require("groq-sdk").Groq;
} catch {
  // Groq SDK opcional
}

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const GEMINI_API_KEY = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .find((k) => k.length > 0) || "";

const LLM_TIMEOUT_MS = 14000;

/**
 * Genera un slug SEO limpio sin llamar a la IA (fallback local).
 */
function generarSlugLocal(nombre, fechaIso, lugar) {
  const raw = `${nombre || "evento"} ${lugar || "loja"} loja eventos ${fechaIso || ""}`;
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 280);
}

/**
 * Genera el copy fallback de redes con la estructura básica de Hermes.
 */
function generarCopyFallback(nombre, lugar, fechaStr, horaStr, appUrl, slug) {
  const webUrl = `${appUrl}/eventos/${slug}`;
  const utmIg = `${webUrl}?utm_source=instagram&utm_medium=social&utm_campaign=hermes`;
  const utmFb = `${webUrl}?utm_source=facebook&utm_medium=social&utm_campaign=hermes`;
  return {
    hook: `¿Ya tienes plan en Loja? 🎭 ${nombre} llega a ${lugar}`,
    copy_instagram: `🎭 ${nombre}\n\n📍 Lugar: ${lugar}\n📅 Fecha: ${fechaStr}\n⏰ Hora: ${horaStr}\n\n📌 Guarda este post para que no olvides la fecha.\n🔗 Más info en agendaculturalloja.com (enlace en la bio)\n\n#AgendaCultural #Loja #CulturaLoja #EventosLoja`,
    copy_facebook: `🎭 ${nombre}\n\n📍 Lugar: ${lugar}\n📅 Fecha: ${fechaStr}\n⏰ Hora: ${horaStr}\n\n🔗 Todos los detalles: ${utmFb}\n\n#AgendaCultural #Loja #EventosLoja`,
    hashtags: ["#AgendaCultural", "#Loja", "#CulturaLoja", "#EventosLoja"],
    utm_ig: utmIg,
    utm_fb: utmFb,
  };
}

/**
 * Extrae y parsea JSON limpio de una respuesta de texto de LLM.
 */
function extraerJson(texto) {
  if (!texto) return null;
  try {
    const limpio = texto
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(limpio);
  } catch {
    const match = texto.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Llama a Groq Cloud con timeout y formato JSON.
 */
async function llamarGroq(prompt) {
  if (!GROQ_API_KEY || !GroqSDK) return null;

  const modelosValidos = ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"];

  for (const modelo of modelosValidos) {
    const res = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), LLM_TIMEOUT_MS);
      const groq = new GroqSDK({ apiKey: GROQ_API_KEY });
      groq.chat.completions
        .create({
          messages: [{ role: "user", content: prompt }],
          model: modelo,
          temperature: 0.25,
          max_tokens: 800,
          response_format: { type: "json_object" },
        })
        .then((resp) => {
          clearTimeout(timer);
          const contenido = resp?.choices?.[0]?.message?.content || "";
          resolve(extraerJson(contenido));
        })
        .catch(() => {
          clearTimeout(timer);
          resolve(null);
        });
    });

    if (res && res.slug && res.copy_instagram) {
      console.log(`[Hermes Enricher] ✅ Enriquecimiento generado con Groq (${modelo})`);
      return res;
    }
  }

  return null;
}

/**
 * Llama a Gemini API si hay key configurada.
 */
function llamarGemini(modelo, prompt) {
  if (!GEMINI_API_KEY) return Promise.resolve(null);

  return new Promise((resolve) => {
    const body = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.25,
        responseMimeType: "application/json",
      },
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/${modelo}:generateContent?key=${GEMINI_API_KEY}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const timer = setTimeout(() => {
      req.destroy();
      resolve(null);
    }, LLM_TIMEOUT_MS);

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        clearTimeout(timer);
        try {
          if (res.statusCode !== 200) return resolve(null);
          const parsed = JSON.parse(data);
          const texto = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          resolve(extraerJson(texto));
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

/**
 * Enriquece los datos de un evento con SEO y copy social.
 */
async function enriquecerEvento(params) {
  const {
    nombre = "",
    lugar = "Loja",
    fechaIso = "",
    fechaStr = "",
    horaStr = "Por confirmar",
    descripcion = "",
    categoria = "Cultura",
    appUrl = "https://www.agendaculturalloja.com",
  } = params;

  const slugBase = generarSlugLocal(nombre, fechaIso, lugar);

  if (!GROQ_API_KEY && !GEMINI_API_KEY && !DEEPSEEK_API_KEY) {
    const copyFallback = generarCopyFallback(nombre, lugar, fechaStr, horaStr, appUrl, slugBase);
    return { slug: slugBase, descripcion_seo: descripcion, ...copyFallback, fuente: "fallback" };
  }

  // Calcular mes y año en español para keywords dinámicos
  const fechaObj = fechaIso ? new Date(fechaIso) : new Date();
  const mesAnio = fechaObj.toLocaleDateString("es-EC", { month: "long", year: "numeric" });
  const utmIg = `${appUrl}/eventos/${slugBase}?utm_source=instagram&utm_medium=social&utm_campaign=hermes`;
  const utmFb = `${appUrl}/eventos/${slugBase}?utm_source=facebook&utm_medium=social&utm_campaign=hermes`;

  const prompt = `
Eres HERMES, el Director de Posicionamiento Digital de "Agenda Cultural Loja" (https://www.agendaculturalloja.com).

Tu tarea es mejorar el posicionamiento en Google y en Redes Sociales de un evento cultural real en Loja, Ecuador.

REGLAS ABSOLUTAS (Constitución de Hermes):
1. PROHIBIDO INVENTAR DATOS. Fecha, hora y lugar deben ser exactamente los dados. No inventes precios, artistas ni fechas diferentes.
2. NO duplicar información redundante.
3. El slug debe contener las palabras clave reales que la gente buscaría en Google Ecuador (ejemplo: concierto-jazz-teatro-bolivar-loja).
4. El hook de Instagram debe detener el pulgar en menos de 120 caracteres con impacto.
5. El copy de redes debe incitar a GUARDAR y COMPARTIR.
6. Hashtags indispensables: #Loja, #AgendaCultural, #CulturaLoja y nicho específico del evento.
7. La descripción SEO DEBE incluir de forma natural (sin repetir): "qué hacer en Loja", "actividades culturales en Loja ${mesAnio}", "planes para el fin de semana en Loja". Estas son long-tail keywords de alto volumen en Ecuador.
8. Para Instagram: el link debe ir como "🔗 agendaculturalloja.com (enlace en bio)" — NUNCA la URL completa en Instagram.
9. Para Facebook: usar la URL con tracking: ${utmFb}

DATOS REALES DEL EVENTO:
- Nombre: ${nombre}
- Lugar: ${lugar}
- Fecha: ${fechaStr}
- Hora: ${horaStr}
- Categoría: ${categoria}
- Descripción actual: ${(descripcion || "").slice(0, 500)}
- URL base: ${appUrl}
- Slug base sugerido: ${slugBase}
- URL con tracking para Facebook: ${utmFb}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "slug": "slug-seo-optimizado-con-palabras-clave-reales-loja",
  "descripcion_seo": "Descripción reescrita para SEO 150-300 palabras. Incluir: nombre del evento, lugar, fecha, categoría, contexto cultural de Loja Ecuador. Incorporar de forma natural: qué hacer en Loja, actividades culturales en Loja ${mesAnio}, planes de fin de semana en Loja. SIN inventar datos.",
  "hook": "Frase de impacto máximo 120 caracteres que detiene el scroll",
  "copy_instagram": "Copy con emojis. Hook + 📍Lugar + 📅Fecha + ⏰Hora + llamado a GUARDAR/COMPARTIR + '🔗 agendaculturalloja.com (enlace en bio)' + hashtags",
  "copy_facebook": "Copy con más contexto. Hook + detalles + '🔗 ${utmFb}' + llamado a la comunidad + hashtags",
  "hashtags": ["#AgendaCultural", "#Loja", "#CulturaLoja", "#EventosLoja", "#QueHacerEnLoja"]
}
`;

  let resultado = null;

  // 1. Probar con Groq (alta velocidad y capacidad de razonamiento)
  if (GROQ_API_KEY && GroqSDK) {
    try {
      resultado = await llamarGroq(prompt);
      if (resultado && resultado.slug && resultado.copy_instagram) {
        console.log(`[Hermes Enricher] ✅ Enriquecimiento generado con Groq para "${nombre}"`);
      }
    } catch (err) {
      console.warn(`[Hermes Enricher] Groq falló: ${err.message}`);
    }
  }

  // 2. Si no hubo respuesta de Groq, probar con Gemini
  if (!resultado && GEMINI_API_KEY) {
    const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    for (const mod of GEMINI_MODELS) {
      try {
        resultado = await llamarGemini(mod, prompt);
        if (resultado && resultado.slug && resultado.copy_instagram) {
          console.log(`[Hermes Enricher] ✅ Enriquecimiento generado con ${mod} para "${nombre}"`);
          break;
        }
      } catch (err) {
        console.warn(`[Hermes Enricher] Gemini ${mod} falló: ${err.message}`);
      }
    }
  }

  // 3. Fallback seguro si ningún modelo respondió
  if (!resultado || !resultado.slug) {
    console.warn(`[Hermes Enricher] ⚠️ LLM no disponible para "${nombre}". Usando fallback local.`);
    const copyFallback = generarCopyFallback(nombre, lugar, fechaStr, horaStr, appUrl, slugBase);
    return { slug: slugBase, descripcion_seo: descripcion, ...copyFallback, fuente: "fallback" };
  }

  // Sanitizar el slug generado
  let slugFinal = (resultado.slug || slugBase)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 280);

  if (!slugFinal) slugFinal = slugBase;

  return {
    slug: slugFinal,
    descripcion_seo: resultado.descripcion_seo || descripcion,
    hook: resultado.hook || `¿Ya tienes plan en Loja? 🎭 ${nombre}`,
    copy_instagram: resultado.copy_instagram || "",
    copy_facebook: resultado.copy_facebook || "",
    hashtags: Array.isArray(resultado.hashtags) ? resultado.hashtags : ["#AgendaCultural", "#Loja", "#QueHacerEnLoja"],
    utm_ig: `${appUrl}/eventos/${slugFinal}?utm_source=instagram&utm_medium=social&utm_campaign=hermes`,
    utm_fb: `${appUrl}/eventos/${slugFinal}?utm_source=facebook&utm_medium=social&utm_campaign=hermes`,
    fuente: "hermes",
  };
}

module.exports = { enriquecerEvento };

