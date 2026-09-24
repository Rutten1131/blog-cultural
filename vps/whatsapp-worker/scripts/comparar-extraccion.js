/**
 * Mide la calidad de la extracción: compara lo GUARDADO contra lo que
 * produce el pipeline actual (vision + carrusel completo) para las mismas URLs.
 *
 * Sirve para responder con números si los cambios mejoran o no.
 *
 * Ejecutar dentro del contenedor:
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/comparar-extraccion.js [maximo]
 */

const { extraerEvento } = require("../lib/url-extractor");

const BASE = "http://127.0.0.1:8083";
const MAX = Number(process.argv[2]) || 6;

const linea = (n = 70) => "-".repeat(n);

function recortar(s, n) {
  if (!s) return "(nada)";
  const limpio = String(s).replace(/\s+/g, " ").trim();
  return limpio.length > n ? limpio.slice(0, n) + "…" : limpio;
}

/** Cuenta cuántos campos clave quedaron completos. */
function completos(datos) {
  return ["titulo", "fecha", "lugar", "imagen"]
    .filter((c) => datos[c])
    .length;
}

async function main() {
  const res = await fetch(`${BASE}/posts?limit=200`);
  const { posts } = await res.json();

  // Una URL puede repetirse (el mismo enlace compartido en varios mensajes).
  const vistos = new Set();
  const objetivos = [];
  for (const p of posts) {
    if (!p.urlOriginal || vistos.has(p.urlOriginal)) continue;
    vistos.add(p.urlOriginal);
    objetivos.push(p);
    if (objetivos.length >= MAX) break;
  }

  console.log(`Comparando ${objetivos.length} URLs...\n`);

  let antesTotal = 0;
  let despuesTotal = 0;
  let antesAprobables = 0;
  let despuesAprobables = 0;

  for (const p of objetivos) {
    console.log(linea());
    console.log("URL:", recortar(p.urlOriginal, 100));

    const antes = {
      titulo: p.titulo,
      fecha: p.fechaPublicacion,
      lugar: p.lugar,
      imagen: p.imagenUrl,
    };
    const antesPuntos = completos(antes);
    antesTotal += antesPuntos;
    const antesOk = Boolean(p.titulo && p.fechaPublicacion && p.lugar);
    if (antesOk) antesAprobables++;

    console.log(
      `ANTES   ${antesPuntos}/4 | fecha: ${antes.fecha ? String(antes.fecha).slice(0, 10) : "NO"} | ` +
        `lugar: ${recortar(antes.lugar, 30)}`
    );

    let datos = null;
    try {
      datos = await extraerEvento(p.urlOriginal, p.textoOriginal || "");
    } catch (e) {
      console.log("ERROR:", e.message);
      continue;
    }

    if (!datos) {
      console.log("DESPUÉS (no se pudo leer la página)");
      continue;
    }

    const despues = {
      titulo: datos.titulo,
      fecha: datos.fecha,
      lugar: datos.lugar,
      imagen: datos.imagenUrl,
    };
    const despuesPuntos = completos(despues);
    despuesTotal += despuesPuntos;
    const despuesOk = Boolean(datos.titulo && datos.fecha && datos.lugar);
    if (despuesOk) despuesAprobables++;

    console.log(
      `DESPUÉS ${despuesPuntos}/4 | fecha: ${datos.fecha ? String(datos.fecha).slice(0, 10) : "NO"} | ` +
        `lugar: ${recortar(datos.lugar, 30)}`
    );
    console.log(`        fotos: ${(datos.imagenesEnVivo || []).length}`);
    console.log(`        título: ${recortar(datos.titulo, 80)}`);
    console.log(`        fuentes: ${JSON.stringify(datos.fuentes || {})}`);
    if ((datos.camposFaltantes || []).length) {
      console.log(`        faltan: ${datos.camposFaltantes.join(", ")}`);
    }
    if ((datos.advertencias || []).length) {
      console.log(`        avisos: ${datos.advertencias.join(" | ")}`);
    }
  }

  const n = objetivos.length || 1;
  console.log("");
  console.log(linea());
  console.log("RESULTADO GLOBAL");
  console.log(linea());
  console.log(
    `Campos completos (de 4 por post):  antes ${antesTotal}  →  después ${despuesTotal}  ` +
      `(promedio ${(antesTotal / n).toFixed(2)} → ${(despuesTotal / n).toFixed(2)})`
  );
  console.log(
    `Posts con título + fecha + lugar:  antes ${antesAprobables}/${n}  →  después ${despuesAprobables}/${n}`
  );
}

main().catch((e) => {
  console.error("Falló:", e.message);
  process.exit(1);
});
