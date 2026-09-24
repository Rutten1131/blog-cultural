/**
 * Resumen legible de los posts capturados.
 *
 * Ejecutar dentro del contenedor:
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/resumen-posts.js
 */

const BASE = "http://127.0.0.1:8083";

function recortar(s, n) {
  if (!s) return "";
  const limpio = String(s).replace(/\s+/g, " ").trim();
  return limpio.length > n ? limpio.slice(0, n) + "…" : limpio;
}

function fuenteDe(url) {
  if (!url) return "?";
  if (/facebook|fb\./i.test(url)) return "Facebook";
  if (/instagram/i.test(url)) return "Instagram";
  if (/youtube|youtu\.be/i.test(url)) return "YouTube";
  if (/tiktok/i.test(url)) return "TikTok";
  if (/drive\.google/i.test(url)) return "Drive";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "?";
  }
}

async function main() {
  const res = await fetch(`${BASE}/posts?limit=200`);
  const data = await res.json();

  console.log(`TOTAL DE POSTS: ${data.total}\n`);

  const conFecha = data.posts.filter((p) => p.fechaPublicacion).length;
  const conLugar = data.posts.filter((p) => p.lugar).length;
  const conImagen = data.posts.filter((p) => p.imagenUrl).length;
  const conTitulo = data.posts.filter((p) => p.titulo).length;
  const conDesc = data.posts.filter((p) => p.descripcion).length;

  console.log("=== COMPLETITUD ===");
  console.log(`  Título      : ${conTitulo}/${data.total}`);
  console.log(`  Descripción : ${conDesc}/${data.total}`);
  console.log(`  Imagen      : ${conImagen}/${data.total}`);
  console.log(`  Fecha       : ${conFecha}/${data.total}`);
  console.log(`  Lugar       : ${conLugar}/${data.total}`);
  console.log();

  console.log("=== POR FUENTE ===");
  const porFuente = {};
  for (const p of data.posts) {
    const f = fuenteDe(p.urlOriginal);
    porFuente[f] = porFuente[f] || { total: 0, conFecha: 0, conImagen: 0 };
    porFuente[f].total++;
    if (p.fechaPublicacion) porFuente[f].conFecha++;
    if (p.imagenUrl) porFuente[f].conImagen++;
  }
  for (const [f, v] of Object.entries(porFuente).sort((a, b) => b[1].total - a[1].total)) {
    console.log(
      `  ${f.padEnd(14)} total ${String(v.total).padStart(3)} | con fecha ${String(v.conFecha).padStart(3)} | con imagen ${String(v.conImagen).padStart(3)}`
    );
  }
  console.log();

  console.log("=== DETALLE ===");
  for (const p of data.posts) {
    console.log(`\n#${p.id}  [${fuenteDe(p.urlOriginal)}]  confianza ${p.confianzaIA}`);
    console.log(`  Título : ${recortar(p.titulo, 90) || "(sin título)"}`);
    console.log(`  Fecha  : ${p.fechaPublicacion || "(sin fecha)"}`);
    console.log(`  Lugar  : ${recortar(p.lugar, 60) || "(sin lugar)"}`);
    console.log(`  Imagen : ${recortar(p.imagenUrl, 70) || "(sin imagen)"}`);
    console.log(`  Texto  : ${recortar(p.descripcion || p.textoOriginal, 150)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
