/**
 * Inspecciona los posts SIN urlOriginal para entender de dónde salieron.
 *
 * Uso (dentro del contenedor):
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/inspeccionar-sin-url.js
 */

const BASE = "http://127.0.0.1:8083";

function rec(s, n) {
  if (!s) return "—";
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

async function main() {
  const res = await fetch(`${BASE}/posts?limit=200`);
  const { posts } = await res.json();

  const sinUrl = posts.filter((p) => !p.urlOriginal);

  console.log(`Posts sin urlOriginal: ${sinUrl.length} de ${posts.length}`);
  console.log("");

  let conImagen = 0;
  for (const p of sinUrl) {
    if (p.imagenUrl) conImagen++;
    const fotos = Array.isArray(p.multimedia) ? p.multimedia.length : 0;
    console.log(
      `#${String(p.id).padStart(3)} conf=${p.confianzaIA}  ` +
        `img=${p.imagenUrl ? "SÍ" : "no"}  multimedia=${fotos}`
    );
    console.log(`      T: ${rec(p.titulo, 70)}`);
    console.log(`      F: ${p.fechaPublicacion ? String(p.fechaPublicacion).slice(0, 10) : "—"}   L: ${rec(p.lugar, 40)}`);
    console.log(`      texto: ${rec(p.textoOriginal, 90)}`);
  }

  console.log("");
  console.log(`De ${sinUrl.length} sin URL, ${conImagen} tienen imagen.`);

  // ¿De dónde salió cada uno? El origen lo dice.
  const origenes = {};
  for (const p of sinUrl) origenes[p.origen] = (origenes[p.origen] || 0) + 1;
  console.log("Orígenes:", JSON.stringify(origenes));

  // Se compara con el total general.
  const conUrls = posts.filter((p) => p.urlOriginal);
  console.log(`Con URL: ${conUrls.length}`);
}

main().catch((e) => {
  console.error("Falló:", e.message);
  process.exit(1);
});
