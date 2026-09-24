/**
 * Diagnóstico: ¿puede Node conectarse a la API de Gemini?
 * Prueba mínima, sin imágenes, con timeout para no colgarse.
 */

const API_KEY = process.env.GEMINI_API_KEY;
const MODELO = process.env.GEMINI_MODELO || "gemini-3.6-flash";

async function main() {
  console.log("Node:", process.version);
  console.log("Modelo:", MODELO);
  console.log("Key presente:", API_KEY ? `sí (${API_KEY.length} caracteres)` : "NO");
  console.log();

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;
  console.log("Endpoint:", endpoint);

  const inicio = Date.now();

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Responde solo con la palabra OK" }] }],
      }),
      // Sin esto, si la red se cuelga el proceso queda esperando para siempre.
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    console.error(`FALLÓ la conexión tras ${Date.now() - inicio} ms`);
    console.error(`Tipo: ${err.name}`);
    console.error(`Mensaje: ${err.message}`);
    if (err.cause) console.error(`Causa: ${err.cause.message ?? err.cause}`);
    process.exit(1);
  }

  console.log(`Respuesta en ${Date.now() - inicio} ms → HTTP ${res.status}`);

  const crudo = await res.text();

  // Solo el principio: la respuesta trae una firma enorme que no interesa.
  console.log("Cuerpo (primeros 300 caracteres):");
  console.log(crudo.slice(0, 300));
}

main().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});
