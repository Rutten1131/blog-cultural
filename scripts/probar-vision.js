/**
 * Prueba suelta: ¿qué tan bien lee Gemini un flyer real?
 *
 * NO forma parte del bot. Es solo para evaluar la calidad antes de
 * integrar la visión artificial al worker.
 *
 * Uso:
 *   node scripts/probar-vision.js <url-de-imagen>
 *   node scripts/probar-vision.js <url1> <url2>   (simula un carrusel)
 */

const fs = require("fs");

const API_KEY = process.env.GEMINI_API_KEY;
// gemini-2.5-flash ya NO está disponible para claves nuevas.
// Google responde 404 y recomienda gemini-3.6-flash.
const MODELO = process.env.GEMINI_MODELO || "gemini-3.6-flash";

const PROMPT = `Sos un asistente que extrae datos de afiches de eventos culturales en Loja, Ecuador.

Mirá las imágenes y extraé los datos del evento que anuncian.

REGLAS ESTRICTAS — son lo más importante:
- Extraé SOLO lo que sea visible en la imagen.
- Si un dato NO aparece, devolvé null. NO lo inventes ni lo deduzcas.
- NO completes el año si no está escrito. Copiá la fecha tal como aparece.
- Si hay varias imágenes, pueden ser partes del mismo afiche: combiná la información.

Respondé ÚNICAMENTE con este JSON, sin texto extra:
{
  "esEventoCultural": true,
  "nombre": "nombre del evento, o null",
  "fechaTexto": "la fecha TAL COMO aparece escrita, o null",
  "horaTexto": "la hora tal como aparece, o null",
  "fechaFinTexto": "si dice hasta cuándo, o null",
  "lugar": "dónde se realiza, o null",
  "precio": "precio o entrada, o null",
  "textoDelAfiche": "todo el texto legible del afiche, o null"
}`;

async function descargar(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (HTTP ${res.status})`);
  const tipo = (res.headers.get("content-type") || "").split(";")[0].trim();
  const buf = Buffer.from(await res.arrayBuffer());
  return { base64: buf.toString("base64"), tipo, peso: buf.length };
}

async function analizar(urls) {
  const partes = [{ text: PROMPT }];

  for (const url of urls) {
    const img = await descargar(url);
    console.log(`  ↓ ${(img.peso / 1024).toFixed(0)} KB (${img.tipo}) — ${url.split("/").pop()}`);
    partes.push({ inline_data: { mime_type: img.tipo, data: img.base64 } });
  }

  const cuerpo = {
    contents: [{ parts: partes }],
    generationConfig: { temperature: 0.0 },
  };

  const pesoCuerpo = JSON.stringify(cuerpo).length;
  console.log(`  → Enviando a Gemini: ${(pesoCuerpo / 1024).toFixed(0)} KB de payload`);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify(cuerpo),
    });
  } catch (err) {
    throw new Error(`La petición HTTP falló: ${err.message}`);
  }

  console.log(`  ← HTTP ${res.status}`);

  const crudo = await res.text();
  fs.writeFileSync("vision-respuesta.json", crudo);

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${crudo.slice(0, 500)}`);
  }

  let data;
  try {
    data = JSON.parse(crudo);
  } catch {
    throw new Error(`La respuesta no es JSON válido: ${crudo.slice(0, 300)}`);
  }

  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!texto) {
    throw new Error(`Sin texto en la respuesta: ${crudo.slice(0, 500)}`);
  }

  // El modelo a veces envuelve el JSON en ```json ... ```
  const limpio = texto.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    return JSON.parse(limpio);
  } catch {
    throw new Error(`No se pudo interpretar el JSON devuelto:\n${texto.slice(0, 600)}`);
  }
}

async function main() {
  const urls = process.argv.slice(2);

  if (urls.length === 0) {
    console.error("Falta la URL de una imagen.");
    console.error("Ejemplo: node scripts/probar-vision.js https://.../flyer.jpg");
    process.exit(1);
  }
  if (!API_KEY) {
    console.error("Falta la variable GEMINI_API_KEY.");
    process.exit(1);
  }

  console.log(`Modelo: ${MODELO}`);
  console.log(`Imágenes: ${urls.length} (se envían todas juntas, como un carrusel)\n`);

  const inicio = Date.now();
  const resultado = await analizar(urls);
  const ms = Date.now() - inicio;

  console.log("\n" + "═".repeat(70));
  console.log("LO QUE GEMINI LEYÓ DEL AFICHE");
  console.log("═".repeat(70));
  console.log(JSON.stringify(resultado, null, 2));
  console.log(`\nTiempo: ${(ms / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error("\n❌ Error:", e.message);
  process.exit(1);
});
