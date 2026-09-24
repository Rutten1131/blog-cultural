/**
 * Volcado crudo de lo que el scraper ve en una URL.
 *
 * Sirve para saber si una página realmente bloquea o si simplemente no
 * expone los datos. Muestra metaetiquetas, JSON-LD, bloques de carrusel,
 * texto visible e imágenes capturadas de la red.
 *
 * Uso (dentro del contenedor):
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/inspeccionar-pagina.js <url>
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

const URL_OBJETIVO = process.argv[2];
if (!URL_OBJETIVO) {
  console.error("Falta la URL.");
  process.exit(1);
}

function rutaChromium() {
  for (const c of ["/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/lib/chromium/chrome"]) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      // sin permisos
    }
  }
  return undefined;
}

function rec(s, n) {
  if (!s) return "(vacío)";
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: rutaChromium(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
  );

  const capturadas = [];
  page.on("response", async (res) => {
    try {
      const tipo = (res.headers()["content-type"] || "").split(";")[0].trim();
      if (!/^image\//.test(tipo)) return;
      const buf = await res.buffer();
      if (buf.length < 8000) return;
      capturadas.push({ url: res.url(), tipo, kb: Math.round(buf.length / 1024) });
    } catch {
      // respuesta ya consumida
    }
  });

  console.log(`URL: ${URL_OBJETIVO}`);
  const respuesta = await page.goto(URL_OBJETIVO, { waitUntil: "domcontentloaded", timeout: 30000 });
  console.log(`HTTP: ${respuesta && respuesta.status()}`);
  await new Promise((r) => setTimeout(r, 4000));

  const datos = await page.evaluate(() => ({
    urlFinal: location.href,
    titulo: document.title,
    og: Object.fromEntries(
      Array.from(document.querySelectorAll("meta[property^='og:'], meta[name^='twitter:']")).map((m) => [
        m.getAttribute("property") || m.getAttribute("name"),
        m.getAttribute("content"),
      ])
    ),
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    bloquesCarrusel: Array.from(document.querySelectorAll("script")).filter((s) =>
      (s.textContent || "").includes("carousel_media")
    ).length,
    bloquesSidecar: Array.from(document.querySelectorAll("script")).filter((s) =>
      (s.textContent || "").includes("edge_sidecar_to_children")
    ).length,
    videoTags: Array.from(document.querySelectorAll("video")).map((v) => v.src || v.currentSrc || "(sin src)"),
    texto: (document.body ? document.body.innerText : "").slice(0, 1200),
  }));

  console.log("");
  console.log("=== URL FINAL ===");
  console.log(datos.urlFinal);
  console.log("");
  console.log("=== TÍTULO ===");
  console.log(rec(datos.titulo, 150));
  console.log("");
  console.log(`=== OG / TWITTER (${Object.keys(datos.og).length}) ===`);
  for (const [k, v] of Object.entries(datos.og)) {
    console.log(`  ${k.padEnd(28)} ${rec(v, 110)}`);
  }
  console.log("");
  console.log(`=== DATOS ESTRUCTURADOS ===`);
  console.log(`  script JSON-LD        : ${datos.jsonLd}`);
  console.log(`  bloques carousel_media: ${datos.bloquesCarrusel}`);
  console.log(`  bloques sidecar (FB)  : ${datos.bloquesSidecar}`);
  console.log(`  etiquetas <video>     : ${datos.videoTags.length}`);
  for (const v of datos.videoTags.slice(0, 3)) console.log(`      ${rec(v, 110)}`);
  console.log("");
  console.log("=== TEXTO VISIBLE (primeros 1200) ===");
  console.log(datos.texto);
  console.log("");
  console.log(`=== IMÁGENES DE RED (${capturadas.length}) ===`);
  for (const c of capturadas.slice(0, 20)) {
    console.log(`  ${String(c.kb).padStart(5)}KB  ${c.tipo.padEnd(12)}  ${rec(c.url, 95)}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
