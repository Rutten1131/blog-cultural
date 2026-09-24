/**
 * Verifica si las imágenes de los posts están en nuestro CDN (permanentes)
 * o siguen apuntando a Facebook/Instagram (caducan).
 *
 * Uso:
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/ver-imagenes.js
 */

const BASE = "http://127.0.0.1:8083";

async function main() {
  const res = await fetch(`${BASE}/posts?limit=100`);
  const data = await res.json();

  const conImagen = data.posts.filter((p) => p.imagenUrl);
  const enBunny = conImagen.filter((p) => p.imagenUrl.includes("b-cdn.net"));
  const caducan = conImagen.filter((p) => !p.imagenUrl.includes("b-cdn.net"));

  console.log(`Total de posts        : ${data.total}`);
  console.log(`Con imagen            : ${conImagen.length}`);
  console.log(`  ✅ En Bunny (permanente): ${enBunny.length}`);
  console.log(`  ⚠️  Externas (caducan)   : ${caducan.length}`);
  console.log();

  for (const p of conImagen) {
    const marca = p.imagenUrl.includes("b-cdn.net") ? "✅ BUNNY" : "⚠️  EXTERNA";
    console.log(`${marca}  #${p.id}  ${p.imagenUrl.slice(0, 92)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
