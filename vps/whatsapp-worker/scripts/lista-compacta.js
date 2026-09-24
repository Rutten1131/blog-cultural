/**
 * Lista compacta de los posts capturados, para juzgar la calidad de un vistazo.
 *
 * Uso (dentro del contenedor):
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/lista-compacta.js
 */

const BASE = "http://127.0.0.1:8083";

function rec(s, n) {
  if (!s) return "—";
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

/** Un lugar que parece una frase cortada no sirve como lugar. */
function lugarDudoso(lugar) {
  if (!lugar) return false;
  const l = lugar.trim();
  if (l.length > 60) return true;
  return /^(de |del |la |el |los |las |y |con |en el|continúa|fortaleciendo)\b/i.test(l);
}

async function main() {
  const res = await fetch(`${BASE}/posts?limit=200`);
  const { posts } = await res.json();

  const orden = [...posts].sort((a, b) => b.id - a.id);

  let completos = 0;   // título + fecha + lugar
  let dudosos = 0;
  let sinNada = 0;

  for (const p of orden) {
    const fecha = p.fechaPublicacion
      ? new Date(p.fechaPublicacion).toISOString().slice(0, 10)
      : "—";
    const fotos = Array.isArray(p.multimedia) ? p.multimedia.length : 1;

    const ok = Boolean(p.titulo && p.fechaPublicacion && p.lugar);
    if (ok) completos++;
    if (!p.titulo && !p.fechaPublicacion && !p.lugar) sinNada++;
    const malLugar = lugarDudoso(p.lugar);
    if (malLugar) dudosos++;

    console.log(
      `#${String(p.id).padStart(3)} ${ok ? "OK " : "·  "} ` +
        `fecha=${fecha}  fotos=${fotos}  ` +
        `${malLugar ? "LUGAR DUDOSO" : ""}\n` +
        `      T: ${rec(p.titulo, 78)}\n` +
        `      L: ${rec(p.lugar, 78)}`
    );
  }

  console.log("");
  console.log(`TOTAL ${orden.length}  |  completos (título+fecha+lugar): ${completos}`);
  console.log(`Con lugar dudoso: ${dudosos}  |  totalmente vacíos: ${sinNada}`);
}

main().catch((e) => {
  console.error("Falló:", e.message);
  process.exit(1);
});
