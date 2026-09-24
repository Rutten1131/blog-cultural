/**
 * Investigación: ¿cómo sacamos TODAS las imágenes de un carrusel?
 *
 * Prueba tres estrategias sobre una publicación real y reporta cuántas
 * imágenes logra obtener con cada una:
 *
 *   A) Captura de red + scroll  → lo que el navegador cargue solo
 *   B) JSON embebido en el HTML → Instagram/Facebook suelen incluir todas
 *      las URLs del carrusel en un <script type="application/json">
 *
 * Uso:
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/inspeccionar-carrusel.js <url>
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

const URL_OBJETIVO = process.argv[2];

if (!URL_OBJETIVO) {
  console.error("Falta la URL. Ejemplo:");
  console.error("  node scripts/inspeccionar-carrusel.js https://www.instagram.com/p/XXXX/");
  process.exit(1);
}

function rutaChromium() {
  const candidatos = ["/usr/bin/chromium-browser", "/usr/bin/chromium"];
  for (const c of candidatos) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return undefined;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: rutaChromium(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  // ── Estrategia A: capturar lo que pase por la red ──
  const capturadas = [];
  page.on("response", async (res) => {
    try {
      const tipo = (res.headers()["content-type"] || "").split(";")[0].trim();
      if (!/^image\//.test(tipo)) return;
      const buf = await res.buffer();
      if (buf.length < 8000) return;
      capturadas.push({ url: res.url(), peso: buf.length });
    } catch {}
  });

  await page.goto(URL_OBJETIVO, { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));

  const trasCarga = capturadas.length;

  // Scroll para forzar la carga diferida
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy(0, 900));
    await new Promise((r) => setTimeout(r, 900));
  }

  const trasScroll = capturadas.length;

  // ── Estrategia B: buscar el JSON embebido ──
  const hallazgos = await page.evaluate(() => {
    const resultado = {
      bloquesJson: 0,
      tieneCarouselMedia: false,
      urlsDelCarrusel: [],
      totalUrlsEnJson: 0,
      clavesInteresantes: [],
    };

    // Instagram escapa las barras como \/ dentro del JSON.
    const desescapar = (t) => t.replace(/\\\//g, "/");

    const scripts = Array.from(document.querySelectorAll("script"));

    for (const s of scripts) {
      const texto = s.textContent || "";
      if (!texto.includes("carousel_media") && !texto.includes("display_url")) continue;

      resultado.bloquesJson++;
      const limpio = desescapar(texto);

      if (texto.includes("carousel_media")) resultado.tieneCarouselMedia = true;

      for (const clave of [
        "carousel_media",
        "image_versions2",
        "display_url",
        "edge_sidecar_to_children",
      ]) {
        if (texto.includes(clave)) resultado.clavesInteresantes.push(clave);
      }

      // Todas las URLs de imagen del bloque (ya desescapadas)
      const todas = limpio.match(/https:\/\/[^"'\\\s]+\.(?:jpg|jpeg|webp|png)[^"'\\\s]*/g) || [];
      resultado.totalUrlsEnJson += todas.length;

      // Solo las que están dentro del carrusel
      const inicioCarrusel = limpio.indexOf('"carousel_media"');
      if (inicioCarrusel !== -1) {
        // Tomamos un trozo generoso a partir de carousel_media
        const trozo = limpio.slice(inicioCarrusel, inicioCarrusel + 200000);
        const delCarrusel = trozo.match(/https:\/\/[^"'\\\s]+\.(?:jpg|jpeg|webp|png)[^"'\\\s]*/g) || [];
        resultado.urlsDelCarrusel = delCarrusel;
      }
    }

    // Facebook: carrusel viene en edge_sidecar_to_children
    const html = desescapar(document.documentElement.innerHTML);
    if (html.includes("edge_sidecar_to_children")) {
      resultado.clavesInteresantes.push("edge_sidecar_to_children (HTML)");
    }

    resultado.clavesInteresantes = [...new Set(resultado.clavesInteresantes)];
    resultado.urlsDelCarrusel = [...new Set(resultado.urlsDelCarrusel)];
    return resultado;
  });

  // ── Reporte ──
  console.log("═".repeat(74));
  console.log(`URL: ${URL_OBJETIVO}`);
  console.log("═".repeat(74));

  console.log("\n[A] CAPTURA DE RED");
  console.log(`    Imágenes tras la carga : ${trasCarga}`);
  console.log(`    Imágenes tras scroll  : ${trasScroll}`);
  console.log(`    Únicas (por URL)      : ${new Set(capturadas.map((c) => c.url)).size}`);

  if (capturadas.length > 0) {
    console.log("    Detalle:");
    const ordenadas = [...capturadas].sort((a, b) => b.peso - a.peso).slice(0, 8);
    for (const c of ordenadas) {
      console.log(`      ${String(Math.round(c.peso / 1024)).padStart(4)} KB  ${c.url.slice(0, 70)}`);
    }
  }

  console.log("\n[B] JSON EMBEBIDO EN EL HTML");
  console.log(`    Bloques con datos de imagen : ${hallazgos.bloquesJson}`);
  console.log(`    ¿Tiene carousel_media?      : ${hallazgos.tieneCarouselMedia ? "SÍ" : "no"}`);
  console.log(`    Claves encontradas          : ${hallazgos.clavesInteresantes.join(", ") || "(ninguna)"}`);
  console.log(`    URLs de imagen en el JSON   : ${hallazgos.totalUrlsEnJson}`);
  console.log(`    URLs crudas del carrusel    : ${hallazgos.urlsDelCarrusel.length}`);

  // Instagram publica cada foto en varias resoluciones. El identificador
  // real de la imagen es el número antes de la extensión:
  //   .../817831068_17898037359600329_2242443633183458887_n.webp?stp=...
  // Agrupando por ese id obtenemos las fotos DISTINTAS del carrusel.
  const porId = new Map();
  for (const u of hallazgos.urlsDelCarrusel) {
    const m = u.match(/\/(\d{6,}_\d{6,}_\d{6,}_n)\./);
    if (!m) continue;
    const id = m[1];

    // Nos quedamos con la versión sin restricción de tamaño (s640x640),
    // que es la de mayor resolución. Si no hay, la primera que aparezca.
    const restringida = /[?&]stp=[^&]*s\d+x\d+/.test(u);
    const actual = porId.get(id);
    if (!actual || (actual.restringida && !restringida)) {
      porId.set(id, { url: u, restringida });
    }
  }

  console.log(`\n    FOTOS DISTINTAS DEL CARRUSEL: ${porId.size}`);
  console.log("    Detalle:");
  for (const [id, v] of porId) {
    console.log(`      ${id.slice(0, 34)}…  ${v.restringida ? "(reducida)" : "(completa)"}`);
  }

  console.log("\n" + "═".repeat(74));
  console.log("CONCLUSIÓN");
  console.log("═".repeat(74));
  console.log(`[A] Red    : ${trasScroll} imágenes capturadas (ruido incluido).`);
  console.log(`[B] JSON   : ${porId.size} foto(s) reales del carrusel.`);
  if (porId.size > 1) {
    console.log("→ Es un CARRUSEL. La estrategia B da exactamente sus fotos.");
  } else if (porId.size === 1) {
    console.log("→ Es una publicación de UNA sola imagen.");
  }
  console.log("→ Estrategia B es la precisa: da solo las fotos del post.");

  await browser.close();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
