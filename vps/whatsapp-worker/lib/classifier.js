/**
 * Clasificador de eventos usando IA (Groq o DeepSeek)
 * Determina si un post es un evento cultural de Loja
 */

const { Groq } = require("groq-sdk");

/**
 * Clasifica un post para determinar si es un evento cultural
 * @param {Object} postData - Datos del post extraído
 * @returns {Promise<Object>} Resultado de clasificación
 */
async function classifyWithIA(postData) {
  try {
    // La API key SIEMPRE viene del entorno. Nunca hardcodeada:
    // este archivo se despliega en el VPS y en el repositorio.
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY no está configurada");
    }

    const groq = new Groq({ apiKey });

    const prompt = `
Eres un clasificador de eventos culturales para la ciudad de Loja, Ecuador.
Tu tarea es determinar si el siguiente contenido corresponde a un evento cultural, artístico, musical, teatral, de danza, exposición, festival, feria, concierto, taller, charla, conferencia o actividad similar que ocurra en Loja o sus parroquias.

Analiza el siguiente contenido y responde ÚNICAMENTE con un JSON válido en este formato:
{
  "esEvento": true/false,
  "confianza": 0.0 a 1.0,
  "categoriaSugerida": "nombre de categoría sugerida o null",
  "razon": "breve explicación de por qué es o no es un evento"
}

Contenido a analizar:
Título: ${postData.titulo || "(sin título)"}
Descripción: ${postData.descripcion || "(sin descripción)"}
Lugar: ${postData.lugar || "(sin lugar)"}
Fecha: ${postData.fechaPublicacion ? postData.fechaPublicacion.toISOString() : "(sin fecha)"}
URL: ${postData.urlOriginal}

Categorías válidas para Loja (elige una o sugiere una similar):
- Música (conciertos, recitales, festivals)
- Teatro (obras, puestas en escena, monólogos)
- Danza (ballet, folklórica, contemporánea)
- Artes Visuales (exposiciones, galerías, pintura, escultura)
- Literatura (presentaciones de libros, poesía, charlas)
- Cine (proyecciones, festivales, cortometrajes)
- Tradiciones y Folclore (festividades, procesiones, celebraciones)
- Gastronomía (ferias food trucks, muestras culinarias)
- Talleres y Cursos (capacitaciones, clases, workshops)
- Conferencias y Charlas (académicas, técnicas, motivacionales)
- Deportes y Recreación (eventos deportivos, recreativos)
- Otros (si no encaja en ninguna anterior pero es cultural)

Si NO es un evento cultural de Loja, pon "esEvento": false y explica brevemente por qué.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      // El modelo anterior (llama3-8b-8192) fue retirado por Groq y ya
      // devuelve error. llama-3.1-8b-instant es su reemplazo vigente.
      model: "llama-3.1-8b-instant",
      temperature: 0.1, // Bajo temperature para resultados consistentes
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(chatCompletion.choices[0].message.content);

    // Validar y normalizar resultado
    return {
      esEvento: !!result.esEvento,
      confianza: Math.max(0, Math.min(1, parseFloat(result.confianza) || 0)),
      categoriaSugerida: result.categoriaSugerida || null,
      razon: result.razon || "",
    };
  } catch (error) {
    console.error("[Classifier] Error en clasificación IA:", error);
    // Fallback: clasificación básica por palabras clave
    return classifyFallback(postData);
  }
}

/**
 * Clasificación de fallback usando palabras clave
 * @param {Object} postData - Datos del post
 * @returns {Object} Resultado de clasificación
 */
function classifyFallback(postData) {
  const textoCompleto = `
    ${postData.titulo || ""}
    ${postData.descripcion || ""}
    ${postData.lugar || ""}
  `.toLowerCase();

  // Palabras clave que indican evento cultural
  const palabrasPositivas = [
    "evento",
    "concierto",
    "festival",
    "exposición",
    "teatro",
    "obra",
    "danza",
    "ballet",
    "música",
    "concierto",
    "recital",
    "presentación",
    "charla",
    "conferencia",
    "taller",
    "curso",
    "festival",
    "feria",
    "muestra",
    "expo",
    "galería",
    "pintura",
    "escultura",
    "danza",
    "folklórica",
    "tradicional",
    "procesión",
    "celebración",
    "aniversario",
    "inauguración",
    "espectáculo",
    "show",
    "presentación",
    "lectura",
    "poesía",
    "libro",
    "cine",
    "película",
    "documental",
    "cortometraje",
    "gastronomía",
    "food truck",
    "culinaria",
    "degustación",
    "taller",
    "curso",
    "capacitación",
    "workshop",
    "seminar",
    "congreso",
    "simposio",
    "deporte",
    "torneo",
    "competencia",
    "recreación",
    "parque",
    "plaza",
    "parroquia",
    "barrio",
    "centro histórico",
  ];

  // Palabras clave que indican que NO es evento
  const palabrasNegativas = [
    "venta",
    "se vende",
    "alquiler",
    "se alquila",
    "empleo",
    "trabajo",
    "busco",
    "se busca",
    "oferta",
    "demanda",
    "servicio",
    "reparación",
    "mantenimiento",
    "instalación",
    "construcción",
    "obra pública",
    "tránsito",
    "vial",
    "cumplimiento",
    "multa",
    "sanción",
    "notificación",
    "aviso legal",
    "resolución",
    "ordenanza",
    "decreto",
    "ley",
    "normativa",
    "trámite",
    "certificado",
    "documento",
    "requisito",
    "formulario",
    "solicitud",
    "cita",
    "turno",
    "horario",
    "atención",
    "consultorio",
    "hospital",
    "clínica",
    "salud",
    "medicina",
    "farmacia",
    "seguro",
    "póliza",
    "inversión",
    "cotización",
    "presupuesto",
    "factura",
    "pago",
    "deuda",
    "crédito",
    "préstamo",
    "banco",
    "financiera",
  ];

  let score = 0;
  let matches = 0;

  // Contar coincidencias positivas
  for (const palabra of palabrasPositivas) {
    if (textoCompleto.includes(palabra.toLowerCase())) {
      score += 1;
      matches++;
    }
  }

  // Restar por coincidencias negativas
  for (const palabra of palabrasNegativas) {
    if (textoCompleto.includes(palabra.toLowerCase())) {
      score -= 0.5;
    }
  }

  // Normalizar score a 0-1
  const confianza = Math.max(0, Math.min(1, matches > 0 ? score / matches : 0));

  // Determinar si es evento basado en umbral
  const esEvento = confianza >= 0.3; // Umbral bajo para no perder eventos reales

  // Sugerir categoría basada en palabras clave
  let categoriaSugerida = null;
  const categoriasMap = {
    música: ["concierto", "música", "recital", "festival", "orquesta", "banda"],
    teatro: ["teatro", "obra", "puesta en escena", "actuación", "monólogo"],
    danza: ["danza", "ballet", "folklórica", "contemporánea", "baile"],
    "artes visuales": [
      "exposición",
      "pintura",
      "escultura",
      "galería",
      "arte",
      "fotografía",
    ],
    literatura: ["libro", "poesía", "lectura", "escritor", "presentación de libro"],
    cine: ["cine", "película", "documental", "cortometraje", "festival de cine"],
    gastronomía: [
      "comida",
      "gastronomía",
      "food truck",
      "culinaria",
      "degustación",
      "sabor",
    ],
    talleres: ["taller", "curso", "capacitación", "workshop", "clase"],
    conferencias: [
      "conferencia",
      "charlas",
      "congreso",
      "simposio",
      "seminario",
      "foro",
    ],
    tradiciones: [
      "folclore",
      "tradicional",
      "procesión",
      "celebración",
      "fiesta",
      "carnaval",
    ],
  };

  for (const [categoria, palabras] of Object.entries(categoriasMap)) {
    for (const palabra of palabras) {
      if (textoCompleto.includes(palabra.toLowerCase())) {
        categoriaSugerida = categoria;
        break;
      }
    }
    if (categoriaSugerida) break;
  }

  return {
    esEvento,
    confianza: parseFloat(confianza.toFixed(2)),
    categoriaSugerida,
    razon: esEvento
      ? "Clasificado por palabras clave de evento cultural"
      : "No contiene suficientes indicadores de evento cultural",
  };
}

module.exports = { classifyWithIA, classifyFallback };