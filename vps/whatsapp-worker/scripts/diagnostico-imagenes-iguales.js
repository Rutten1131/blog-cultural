/**
 * Detecta si varios posts comparten la MISMA imagen (aunque la URL cambie).
 *
 * Por qué importa: cuando Facebook no deja ver el post, su `og:image` es un
 * marcador genérico. Todos los posts terminan con la misma imagen de relleno,
 * que no dice nada del evento.
 *
 * Uso (dentro del contenedor):
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/diagnostico-imagenes-iguales.js
 */

const crypto = require("crypto");

const BASE = "http://127.0.0.1:8083";

function rec(s, n) {
  if (!s) return "—";
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

async function huella(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    const buf = Buffer.from(await r.arrayBuffer());
    return {
      hash: crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16),
      pesoKB: Math.round(buf.length / 1024),
      tipo: (r.headers.get("content-type") || "?").split(";")[0],
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  const res = await fetch(`${BASE}/posts?limit=200`);
  const { posts } = await res.json();

  const porHash = new Map();

  for (const p of posts) {
    if (!p.imagenUrl) {
      console.log(`#${String(p.id).padStart(3)}  SIN IMAGEN   ${rec(p.titulo, 55)}`);
      continue;
    }

    const h = await huella(p.imagenUrl);

    if (h.error) {
      console.log(`#${String(p.id).padStart(3)}  ERROR ${h.error}  ${rec(p.titulo, 45)}`);
      continue;
    }

    console.log(
      `#${String(p.id).padStart(3)}  ${h.hash}  ${String(h.pesoKB).padStart(4)}KB  ` +
        `${h.tipo.padEnd(11)}  ${rec(p.titulo, 45)}`
    );

    if (!porHash.has(h.hash)) porHash.set(h.hash, []);
    porHash.get(h.hash).push({ id: p.id, titulo: rec(p.titulo, 45), pesoKB: h.pesoKB });
  }

  console.log("");
  console.log("=== IMÁGENES REPETIDAS ===");

  let repetidas = 0;
  for (const [hash, lista] of porHash) {
    if (lista.length < 2) continue;
    repetidas += lista.length;
    console.log(`\n${hash}  (${lista.length} posts, ${lista[0].pesoKB} KB)`);
    for (const x of lista) console.log(`   #${x.id}  ${x.titulo}`);
  }

  console.log("");
  console.log(
    `Imágenes distintas: ${porHash.size}  |  posts con imagen repetida: ${repetidas}  ` +
      `|  total posts: ${posts.length}`
  );
}

main().catch((e) => {
  console.error("Falló:", e.message);
  process.exit(1);
});
