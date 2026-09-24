/**
 * Muestra el texto original completo de un post, para auditar de dónde
 * salió cada dato extraído.
 *
 * Uso:
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/ver-post.js 9
 */

const BASE = "http://127.0.0.1:8083";

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Falta el ID del post. Ejemplo: node scripts/ver-post.js 9");
    process.exit(1);
  }

  const res = await fetch(`${BASE}/posts?limit=200`);
  const data = await res.json();
  const post = data.posts.find((p) => String(p.id) === String(id));

  if (!post) {
    console.error(`No se encontró el post #${id}`);
    process.exit(1);
  }

  console.log(`POST #${post.id}`);
  console.log(`URL        : ${post.urlOriginal}`);
  console.log(`Título     : ${post.titulo}`);
  console.log(`Fecha      : ${post.fechaPublicacion}`);
  console.log(`Lugar      : ${post.lugar}`);
  console.log(`Imagen     : ${post.imagenUrl}`);
  console.log(`Confianza  : ${post.confianzaIA}`);
  console.log();
  console.log("=== DESCRIPCIÓN EXTRAÍDA ===");
  console.log(post.descripcion || "(vacía)");
  console.log();
  console.log("=== TEXTO ORIGINAL DEL MENSAJE DE WHATSAPP ===");
  console.log(post.textoOriginal || "(vacío)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
