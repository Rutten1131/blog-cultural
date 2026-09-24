/**
 * Comprueba que las imágenes guardadas existan de verdad en el CDN
 * y cuántos posts traen carrusel (varias fotos).
 *
 * Uso (dentro del contenedor):
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/verificar-imagenes.js
 */

const BASE = "http://127.0.0.1:8083";

async function main() {
  const res = await fetch(`${BASE}/posts?limit=200`);
  const { posts } = await res.json();

  let conCarrusel = 0;
  let fotosTotales = 0;

  for (const p of posts) {
    const fotos = Array.isArray(p.multimedia) ? p.multimedia : [];
    if (fotos.length > 1) {
      conCarrusel++;
      fotosTotales += fotos.length;
    }
  }

  console.log(`Posts: ${posts.length}`);
  console.log(`Con carrusel (más de 1 foto): ${conCarrusel}  (${fotosTotales} fotos)`);
  console.log("");

  // Se comprueban las primeras 10 portadas con una petición HEAD.
  const conImagen = posts.filter((p) => p.imagenUrl).slice(0, 10);
  let ok = 0;
  let mal = 0;

  for (const p of conImagen) {
    try {
      const r = await fetch(p.imagenUrl, { method: "HEAD", signal: AbortSignal.timeout(12000) });
      const tipo = r.headers.get("content-type") || "?";
      if (r.ok) {
        ok++;
        console.log(`  OK  ${r.status}  ${tipo}  ${p.imagenUrl.slice(-45)}`);
      } else {
        mal++;
        console.log(`  MAL ${r.status}  ${tipo}  ${p.imagenUrl.slice(-45)}`);
      }
    } catch (e) {
      mal++;
      console.log(`  MAL error    ${p.imagenUrl.slice(-45)} → ${e.message}`);
    }
  }

  console.log("");
  console.log(`Portadas comprobadas: ${ok} OK, ${mal} con problema`);
}

main().catch((e) => {
  console.error("Falló:", e.message);
  process.exit(1);
});
