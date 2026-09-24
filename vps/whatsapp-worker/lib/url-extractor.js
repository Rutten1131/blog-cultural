/**
 * Extracción de datos de eventos — Worker de WhatsApp
 *
 * PRINCIPIO RECTOR: "no inventarse nada".
 *   Cada campo extraído guarda de qué fuente salió (`fuentes`). Los campos
 *   que no se pudieron leer quedan en `null` y se listan en `camposFaltantes`.
 *   El moderador ve exactamente qué es dato real y qué falta.
 *
 * ORDEN DE PRIORIDAD:
 *   1. JSON-LD schema.org/Event → dato estructurado publicado por el
 *      organizador. Es la fuente más confiable (fecha, lugar, imagen exactos).
 *   2. Texto del mensaje de WhatsApp → el organizador suele escribir
 *      "Sábado 4 de octubre, 19h00, Teatro Bolívar" en el propio mensaje.
 *   3. OpenGraph / Twitter Card → sirve bien para título, descripción e imagen,
 *      pero casi nunca trae la fecha ni el lugar reales del evento.
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const { fechaDesdeIso, extraerRangoDeTexto } = require("./fechas-es");
const { rehospedarImagen, configurado: bunnyConfigurado } = require("./imagenes");
const { leerAfiche, configurado: visionConfigurada } = require("./vision");

// ─── Extracción de URLs desde texto ───────────────────────────────────────

/**
 * Extrae todas las URLs de un texto.
 * @param {string} text
 * @returns {string[]}
 */
function extractUrls(text) {
  if (!text || typeof text !== "string") return [];

  const urlPattern = /(https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+)/gi;
  const matches = text.match(urlPattern);
  if (!matches) return [];

  const vistos = new Set();
  const resultado = [];

  for (const match of matches) {
    const url = match.startsWith("www.") ? `https://${match}` : match;
    // Quitar puntuación final que suele quedar pegada: "...evento." / "...evento,"
    const limpia = url.replace(/[.,;:!?]+$/, "");

    try {
      const parsed = new URL(limpia);
      if (!/^https?:$/.test(parsed.protocol)) continue;
      if (vistos.has(limpia)) continue;
      vistos.add(limpia);
      resultado.push(limpia);
    } catch {
      // URL inválida, se descarta
    }
  }

  return resultado;
}

// ─── Utilidades de limpieza ───────────────────────────────────────────────

/** Quita el sufijo de marca típico de los <title>: "Evento | NombreDelSitio". */
function limpiarTitulo(t) {
  if (!t || typeof t !== "string") return null;
  let s = t.replace(/\s+/g, " ").trim();
  if (!s) return null;

  const partes = s.split(/\s+[|\u2013\u2014]\s+|\s+-\s+/);
  if (partes.length > 1 && partes[0].trim().length >= 12) {
    s = partes[0].trim();
  }
  return s.slice(0, 255) || null;
}

// Títulos que NO aportan nada: son el nombre de la red social, una pantalla
// de login/consentimiento, o la interfaz del servicio (nunca el evento).
const TITULO_GENERICO =
  /^(?:facebook|instagram|youtube|tiktok|twitter|\bx\b|threads|log\s?in|sign\s?in|iniciar\s+sesi[óo]n|watch|video|reel|post|story|before\s+you\s+continue.*|just\s+a\s+moment.*|attention\s+required.*|content\s+not\s+available.*|p[aá]gina\s+no\s+disponible.*|error|redirecting.*|untitled|google\s+drive|.*\s[–—-]\s*google\s+drive|ordner.*|.*\s[–—-]\s*youtube|youtube\s+music|microsoft\s+onedrive|onedrive|dropbox|mega\s*-.*|iniciar\s+sesi[óo]n.*)$/i;

function esTituloGenerico(t) {
  if (!t) return true;
  return TITULO_GENERICO.test(t.trim());
}

/**
 * Saca un título de la primera línea útil del mensaje de WhatsApp.
 * Se usa cuando el enlace no da un título real (caso típico de Facebook).
 */
function tituloDesdeCaption(texto) {
  if (!texto || typeof texto !== "string") return null;

  const lineas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const linea of lineas) {
    const sinUrls = linea.replace(/https?:\/\/\S+/g, " ");
    const sinHashtags = sinUrls.replace(/#[\p{L}\p{N}_]+/gu, " ");
    // Quitar emojis y signos del principio
    const limpio = sinHashtags
      .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\s|•·.,;:()\[\]{}<>"'«»-]+/u, "")
      .replace(/\s+/g, " ")
      .trim();

    if (limpio.length >= 10) return limpio.slice(0, 255);
  }

  return null;
}

// Palabras que indican que NO es un lugar real.
// Evita basura del tipo "en el año 2024" o "en esta ocasión".
const LUGAR_INVALIDO =
  /^(?:el|la|los|las|un|una|este|esta|ese|esa|su|mi|nuestro|nuestra|todo|toda|todos|todas|general|varios|diversos|este\s+a[ñn]o|el\s+a[ñn]o|la\s+ciudad|esta\s+ocasi[óo]n|el\s+mes|la\s+fecha|el\s+marco|el\s+contexto|caso|sign\s?in|sign|log\s?in|iniciar\s+sesi[óo]n|facebook|instagram|youtube|tiktok|twitter|whatsapp|cookies|privacidad|privacy|ver\s+m[aá]s|see\s+more|loading|cargando)\b/i;

/** Normaliza y valida un candidato a lugar. Devuelve null si no es creíble. */
function limpiarLugar(v) {
  if (!v || typeof v !== "string") return null;

  let s = v.replace(/\s+/g, " ").trim();
  s = s.replace(/^[\s:,-]+/, "").replace(/[\s.,;:]+$/, "").trim();

  if (s.length < 4) return null;
  if (LUGAR_INVALIDO.test(s)) return null;
  // Frase cortada: empieza con una palabra de enlace en minúscula.
  // Ejemplos reales que se colaban:
  //   "de Cultura continúa fortaleciendo y apoyando a los escritores..."
  //   "es puedan consolidarse"
  if (/^(?:de|del|con|y|o|que|se|su|al|para|por|en|es|son|contin[uú]a|esta|este)\s/i.test(s)) {
    return null;
  }
  // Un lugar no es una frase larga.
  if (s.length > 70) return null;
  if (/^\d+$/.test(s)) return null;
  // Horas sueltas: "19h00", "19:00"
  if (/^\d{1,2}\s*(?:h|:)\s*\d{2}$/i.test(s)) return null;
  // Fechas sueltas: "4 de octubre"
  if (/^\d{1,2}\s+de\s+\w+$/i.test(s)) return null;
  // URLs pegadas
  if (/^https?:\/\//i.test(s)) return null;

  return s.slice(0, 255);
}

/**
 * Busca el lugar en el texto libre del mensaje.
 * Prioriza etiquetas explícitas ("Lugar: X") antes que prosa.
 */
function extraerLugarDeTexto(texto) {
  if (!texto || typeof texto !== "string") return null;

  // 1. Etiqueta explícita o marcador con emoji de ubicación (📍).
  //    Los posts del grupo suelen escribir "📍 Iglesia Catedral", así que
  //    reconocer el emoji es esencial.
  //    OJO: no incluir "teatro"/"auditorio" aquí; son nombres de lugares,
  //    no etiquetas. Si se incluyen, "en el Teatro Bolívar" daría "Bolívar".
  const etiquetado =
    /(?:📍|\b(?:lugar|ubicaci[óo]n|sede|direcci[óo]n|d[óo]nde|local|venue)\s*:?)\s*([^\n\r|]{3,90})/i.exec(
      texto
    );
  if (etiquetado) {
    const limpio = limpiarLugar(etiquetado[1]);
    if (limpio) return limpio;
  }

  // 2. "en el Teatro Bolívar" / "en la Casa de la Cultura"
  //    Exige mayúscula inicial → descarta "en el año", "en esta ocasión".
  const enNombrePropio =
    /\ben\s+(?:el|la|los|las)?\s*([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ'’.-]*(?:\s+(?:de|del|la|las|los|y|San|Santa)?\s*[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ'’.-]*){0,4})/.exec(
      texto
    );
  if (enNombrePropio) {
    const limpio = limpiarLugar(enNombrePropio[1]);
    if (limpio) return limpio;
  }

  return null;
}

/** ¿El texto es solo un enlace? Entonces no sirve como descripción. */
function esSoloUrl(texto) {
  if (!texto) return true;
  const sinUrls = texto.replace(/https?:\/\/\S+/g, "").replace(/[\s.,;:()\[\]]+/g, "");
  return sinUrls.length < 15;
}

/** Elige la mejor descripción disponible entre el caption y los meta tags. */
function mejorDescripcion(caption, og, meta) {
  const norm = (v) => {
    if (typeof v !== "string") return "";
    const limpio = v.replace(/\s+/g, " ").trim();
    // Descartar descripciones que son únicamente la URL del enlace.
    return esSoloUrl(limpio) ? "" : limpio;
  };

  const c = { valor: norm(caption), fuente: "caption" };
  const o = { valor: norm(og), fuente: "og" };
  const m = { valor: norm(meta), fuente: "meta" };

  // La descripción escrita por el organizador suele ser la más específica.
  if (c.valor.length >= 80) return c;

  const candidatos = [c, o, m].filter((x) => x.valor.length >= 40);
  if (candidatos.length > 0) {
    return candidatos.reduce((a, b) => (b.valor.length > a.valor.length ? b : a));
  }

  return [c, o, m].find((x) => x.valor.length > 0) || null;
}

/** Normaliza el campo `image` de JSON-LD (string | string[] | {url} | [{url}]). */
function normalizarImagen(img) {
  if (!img) return null;
  if (typeof img === "string") return img.trim() || null;

  if (Array.isArray(img)) {
    for (const item of img) {
      const r = normalizarImagen(item);
      if (r) return r;
    }
    return null;
  }

  if (typeof img === "object") {
    if (typeof img.url === "string") return img.url.trim() || null;
    if (typeof img.contentUrl === "string") return img.contentUrl.trim() || null;
  }

  return null;
}

/** Normaliza el campo `location` de JSON-LD a texto plano. */
function normalizarLugar(location) {
  if (!location) return null;

  if (typeof location === "string") return limpiarLugar(location);

  if (Array.isArray(location)) {
    for (const item of location) {
      const r = normalizarLugar(item);
      if (r) return r;
    }
    return null;
  }

  if (typeof location === "object") {
    if (typeof location.name === "string") {
      const limpio = limpiarLugar(location.name);
      if (limpio) return limpio;
    }

    const addr = location.address;
    if (typeof addr === "string") return limpiarLugar(addr);

    if (addr && typeof addr === "object") {
      const partes = [
        location.name,
        addr.streetAddress,
        addr.addressLocality,
        addr.addressRegion,
      ].filter((p) => typeof p === "string" && p.trim());

      if (partes.length > 0) {
        return limpiarLugar(partes.slice(0, 2).join(", "));
      }
    }
  }

  return null;
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────

/** Aplana un nodo JSON-LD (soporta @graph y arrays anidados). */
function aplanarJsonLd(nodo, salida = []) {
  if (!nodo) return salida;

  if (Array.isArray(nodo)) {
    for (const item of nodo) aplanarJsonLd(item, salida);
    return salida;
  }

  if (typeof nodo !== "object") return salida;

  salida.push(nodo);
  if (nodo["@graph"]) aplanarJsonLd(nodo["@graph"], salida);

  return salida;
}

/** ¿El @type corresponde a un evento? Cubre Event, MusicEvent, TheaterEvent... */
function esTipoEvento(tipo) {
  const tipos = Array.isArray(tipo) ? tipo : [tipo];
  return tipos.some((t) => typeof t === "string" && /event$/i.test(t.trim()));
}

/** Busca el primer nodo schema.org/Event dentro de los bloques JSON-LD. */
function buscarEventoJsonLd(bloques) {
  if (!Array.isArray(bloques)) return null;

  for (const raw of bloques) {
    if (!raw || typeof raw !== "string") continue;

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue; // JSON-LD malformado, se ignora
    }

    const nodos = aplanarJsonLd(data);
    const evento = nodos.find((n) => esTipoEvento(n["@type"]));
    if (evento) return evento;
  }

  return null;
}

// ─── Selección de las imágenes del post ───────────────────────────────────

/** Identificador real de una foto de Instagram/Facebook, o null. */
function idDeUrl(url) {
  const m = (url || "").match(/\/(\d{6,}_\d{6,}_\d{6,}_n)\./);
  return m ? m[1] : null;
}

/**
 * Tipos que sí son imágenes de verdad.
 *
 * Ojo: Facebook sirve `image/x.fb.keyframes`, que NO es una foto sino un
 * sprite interno de la interfaz. Si se cuela, se sube como imagen del post
 * y además rompe la llamada a la IA (HTTP 400).
 */
const TIPOS_IMAGEN_REALES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/bmp",
]);

/**
 * Recursos de la interfaz, no del post.
 *
 * `rsrc.php` son los sprites y logos del propio Instagram/Facebook: nunca
 * son la imagen de un evento.
 */
function esRecursoDeInterfaz(url) {
  return /\/rsrc\.php/i.test(url || "");
}

/**
 * Devuelve el texto del array u objeto JSON que empieza en `desde`.
 *
 * Se recorre carácter a carácter contando llaves y corchetes para hallar el
 * cierre real. Es necesario porque el bloque viene incrustado en un <script>
 * enorme y un recorte por longitud parte el JSON.
 */
function recorteJson(texto, desde) {
  const abre = texto[desde];
  if (abre !== "[" && abre !== "{") return null;
  const cierra = abre === "[" ? "]" : "}";

  let nivel = 0;
  let dentroTexto = false;
  let escapado = false;

  for (let i = desde; i < texto.length; i++) {
    const c = texto[i];

    if (dentroTexto) {
      if (escapado) escapado = false;
      else if (c === "\\") escapado = true;
      else if (c === '"') dentroTexto = false;
      continue;
    }

    if (c === '"') {
      dentroTexto = true;
    } else if (c === abre) {
      nivel++;
    } else if (c === cierra) {
      nivel--;
      if (nivel === 0) return texto.slice(desde, i + 1);
    }
  }

  return null;
}

/** JSON.parse que no lanza: devuelve null si el bloque está malformado. */
function intentarJson(texto) {
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/**
 * URL de mayor resolución de una foto del post.
 *
 * Instagram publica cada foto en varios tamaños dentro de
 * `image_versions2.candidates`. Se busca el más grande sin pasar de 2048 px
 * (más grande encarece la subida y no mejora la lectura del afiche).
 */
function mejorUrlDeMedia(item) {
  if (!item) return null;

  const candidatos = item.image_versions2 && item.image_versions2.candidates;
  if (Array.isArray(candidatos) && candidatos.length > 0) {
    const area = (c) => (c.width || 0) * (c.height || 0);
    const utiles = candidatos.filter((c) => c && c.url);
    if (utiles.length > 0) {
      const dentroDelLimite = utiles.filter((c) => (c.width || 0) <= 2048);
      const grupo = dentroDelLimite.length > 0 ? dentroDelLimite : utiles;
      return grupo.reduce((a, b) => (area(b) > area(a) ? b : a)).url;
    }
  }

  return item.display_url || item.thumbnail_src || item.display_uri || null;
}

/**
 * Saca las fotos del post desde el JSON embebido, EN ORDEN y sin ruido.
 *
 * Por qué desde el JSON y no de la red: se comprobó que Instagram solo pide
 * por red la foto que muestra en ese momento. Las demás del carrusel existen
 * únicamente dentro del JSON, así que esperarlas en la red no sirve. Aquí se
 * obtienen sus URLs reales (ya firmadas por el CDN) y luego se descargan.
 *
 * @returns {Array<{id:string|null, url:string}>}
 */
function fotosDelCarrusel(bloques) {
  const fotos = [];
  const vistos = new Set();

  const agregar = (id, url) => {
    if (!url || !/^https?:\/\//.test(url)) return;
    const clave = id || url.split("?")[0];
    if (vistos.has(clave)) return;
    vistos.add(clave);
    fotos.push({ id: id || null, url });
  };

  for (const bruto of bloques || []) {
    // ── Instagram: "carousel_media": [ {...}, {...} ] ──
    const marcaIg = bruto.indexOf('"carousel_media"');
    if (marcaIg !== -1) {
      const corchete = bruto.indexOf("[", marcaIg);
      const media = intentarJson(recorteJson(bruto, corchete));
      for (const item of Array.isArray(media) ? media : []) {
        const url = mejorUrlDeMedia(item);
        agregar(idDeUrl(url), url);
      }
      continue; // este bloque ya se aprovechó
    }

    // ── Facebook: "edge_sidecar_to_children": { "edges": [...] } ──
    const marcaFb = bruto.indexOf('"edge_sidecar_to_children"');
    if (marcaFb !== -1) {
      const llave = bruto.indexOf("{", marcaFb);
      const data = intentarJson(recorteJson(bruto, llave));
      for (const edge of (data && data.edges) || []) {
        const nodo = edge.node || edge;
        const url = mejorUrlDeMedia(nodo);
        agregar(idDeUrl(url) || (nodo && nodo.id), url);
      }
    }
  }

  return fotos;
}

/** Descarga una imagen del CDN con cabeceras de navegador. */
async function descargarFoto(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8",
        "Accept-Language": "es-EC,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return null;

    const tipo = (res.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!/^image\//.test(tipo)) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000 || buf.length > 8 * 1024 * 1024) return null;

    return { url, tipo, buf };
  } catch {
    return null;
  }
}

/**
 * Descarga varias fotos de a poco (3 a la vez) para no saturar el CDN.
 * @returns {Promise<Array<{url:string, tipo:string, buf:Buffer}>>}
 */
async function descargarFotos(urls) {
  const resultado = [];
  const LOTE = 3;

  for (let i = 0; i < urls.length; i += LOTE) {
    const lote = urls.slice(i, i + LOTE);
    const bajadas = await Promise.all(lote.map((u) => descargarFoto(u)));
    for (const f of bajadas) {
      if (f) resultado.push(f);
    }
  }

  return resultado;
}

/**
 * Elige las imágenes que se van a usar del post.
 * @returns {Promise<Array<{url:string, tipo:string, buf:Buffer}>>}
 */
async function seleccionarImagenes(crudo, capturadas) {
  // Página bloqueada por un muro de login: no hay NINGUNA imagen del post.
  // Se corta aquí para no guardar dibujos de la interfaz como afiche.
  if (crudo.esMuroDeLogin) {
    console.log(
      "[Extractor] Página tras un muro de login: no se usará ninguna imagen"
    );
    return [];
  }

  const carrusel = fotosDelCarrusel(crudo.jsonCarrusel);
  const MAX_CARRUSEL = Number(process.env.MAX_FOTOS_CARRUSEL) || 10;
  const pedidas = carrusel.slice(0, MAX_CARRUSEL).map((f) => f.url);

  console.log(
    `[Extractor] Imágenes: ${carrusel.length} en el carrusel del post, ` +
      `${capturadas.length} capturadas de la red, ` +
      `${(crudo.jsonCarrusel || []).length} bloque(s) JSON`
  );

  // 1. Fotos del carrusel: se descargan directo del CDN, en el orden del post.
  let resultado = [];
  if (pedidas.length > 0) {
    resultado = await descargarFotos(pedidas);

    if (resultado.length < pedidas.length) {
      // Respaldo: las que no se pudieron bajar, se buscan entre lo capturado.
      const faltantes = pedidas.filter((u) => !resultado.some((f) => f.url === u));
      const respaldo = faltantes
        .map((u) => {
          const id = idDeUrl(u);
          const c = capturadas.find((x) => idDeUrl(x.url) === id);
          return c || null;
        })
        .filter(Boolean);

      if (respaldo.length > 0) resultado = resultado.concat(respaldo);
    }

    console.log(
      `[Extractor] Carrusel: ${resultado.length}/${pedidas.length} fotos obtenidas ` +
        `(${resultado.reduce((s, f) => s + f.buf.length, 0) / 1024 | 0} KB)`
    );
  }

  // 2. Sin carrusel: el og:image, que es la portada que publica el sitio.
  //    Si no se capturó de la red, se descarga igual que las del carrusel.
  if (resultado.length === 0 && crudo.ogImagen) {
    const capturada = capturadas.find((c) => c.url === crudo.ogImagen);
    const bajada = capturada || (await descargarFoto(crudo.ogImagen));
    if (bajada) resultado = [bajada];
  }

  // NO hay paso 3. Antes existía un respaldo que tomaba "la imagen más
  // pesada de todas" y eso metía dibujos de la interfaz (por ejemplo el de
  // la política de cookies de Facebook) como si fueran el afiche del
  // evento. Si no hay carrusel ni og:image, este post se queda SIN imagen:
  // es preferible no mostrar nada antes que mostrar algo que no es.

  return resultado;
}

// ─── Navegador ────────────────────────────────────────────────────────────

/** Localiza el binario de Chromium instalado en la imagen Alpine. */
function rutaChromium() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidatos = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/lib/chromium/chrome",
  ];

  for (const c of candidatos) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      // sin permisos, seguimos
    }
  }

  return undefined; // puppeteer usará su propio Chrome
}

/** Descarga la página y devuelve el material crudo para analizar. */
async function leerPagina(url) {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: rutaChromium(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(20000);

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
    );

    // Captura de imágenes A NIVEL DE RED.
    //
    // Por qué así: los CDN de Instagram y Facebook devuelven 403 a un fetch
    // normal, y desde el JavaScript de la página tampoco se pueden leer
    // porque el navegador aplica CORS (la imagen vive en otro dominio).
    // Interceptando la respuesta en Puppeteer no hay CORS ni bloqueo:
    // son los bytes reales que el navegador ya descargó.
    const imagenesCapturadas = [];
    const capturasPendientes = [];
    let bytesCapturados = 0;

    page.on("response", (res) => {
      // Cada captura se guarda como promesa: bajar el cuerpo de la respuesta
      // es asíncrono, y si se lee el array antes de que terminen se pierden
      // imágenes. Al final se esperan todas.
      const tarea = (async () => {
        try {
          const tipo = (res.headers()["content-type"] || "")
            .split(";")[0]
            .trim()
            .toLowerCase();

          if (!TIPOS_IMAGEN_REALES.has(tipo)) return;
          if (esRecursoDeInterfaz(res.url())) return;
          if (bytesCapturados > 40 * 1024 * 1024) return;

          const buf = await res.buffer();
          if (buf.length < 8000) return; // iconos y sprites
          if (buf.length > 8 * 1024 * 1024) return;

          bytesCapturados += buf.length;
          imagenesCapturadas.push({ url: res.url(), tipo, buf });
        } catch {
          // Respuesta ya consumida o redirigida: se ignora.
        }
      })();

      capturasPendientes.push(tarea);
    });

    // domcontentloaded es más seguro que networkidle0, que se cuelga en
    // páginas con trackers o conexiones abiertas.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Margen para que se hidraten los meta tags y se carguen las imágenes.
    await new Promise((r) => setTimeout(r, 2000));

    // Un poco de scroll: fuerza la carga diferida de las fotos del carrusel.
    await page.evaluate(() => window.scrollBy(0, 800)).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));

    // Esperar a que terminen TODAS las descargas de imágenes en curso.
    // Sin esto se leen solo las primeras y se pierde el carrusel completo.
    await Promise.allSettled(capturasPendientes);

    // OJO: no se usa `await` aquí dentro. La imagen se captura a nivel de
    // red (ver el listener de "response" más arriba), no desde la página.
    const crudo = await page.evaluate(() => {
      const meta = (selector, attr) => {
        const el = document.querySelector(selector);
        return el ? el.getAttribute(attr) : null;
      };

      const texto = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      // ── ¿La página está BLOQUEADA por un muro de login? ──
      //
      // Por qué se comprueba: los enlaces facebook.com/share/... redirigen
      // a /login. La página que se descarga es la pantalla de "Log into
      // Facebook", cuyas únicas imágenes son los dibujos de la política de
      // cookies. Sin esta comprobación, uno de esos dibujos terminaba
      // guardado como afiche del evento.
      const urlFinal = location.href;
      const tituloDoc = (document.title || "").trim();
      const hayOgTitulo = Boolean(document.querySelector('meta[property="og:title"]'));
      const hayJsonLd = document.querySelectorAll('script[type="application/ld+json"]').length > 0;
      const urlDeLogin = /\/login|\/checkpoint|accounts\.facebook\.com|\/signin/i.test(urlFinal);
      const tituloDeLogin = /^(facebook|instagram|log in|log into|iniciar sesi|sign in)/i.test(tituloDoc);

      return {
        urlFinal,
        urlDeLogin,
        esMuroDeLogin: urlDeLogin || (!hayOgTitulo && !hayJsonLd && tituloDeLogin),
        tituloDocumento: document.title || null,
        h1: texto("h1"),
        ogTitulo: meta('meta[property="og:title"]', "content"),
        ogDescripcion: meta('meta[property="og:description"]', "content"),
        ogImagen: meta('meta[property="og:image"]', "content"),
        ogSitio: meta('meta[property="og:site_name"]', "content"),
        metaDescripcion: meta('meta[name="description"]', "content"),
        twitterTitulo: meta('meta[name="twitter:title"]', "content"),
        twitterDescripcion: meta('meta[name="twitter:description"]', "content"),
        twitterImagen: meta('meta[name="twitter:image"]', "content"),
        jsonLd: Array.from(
          document.querySelectorAll('script[type="application/ld+json"]')
        )
          .map((s) => s.textContent)
          .slice(0, 25),
        textoVisible: (document.body ? document.body.innerText : "").slice(0, 8000),
        // Instagram y Facebook embeben en el HTML un bloque JSON con TODAS
        // las fotos del post (campo `carousel_media` / `edge_sidecar_to_children`).
        // De ahí se obtienen las fotos del carrusel COMPLETO, en orden y sin
        // ruido (nada de fotos de perfil ni sugerencias).
        //
        // Las barras vienen escapadas como \/ , por eso se desescapan aquí.
        jsonCarrusel: Array.from(document.querySelectorAll("script"))
          .map((s) => (s.textContent || "").replace(/\\\//g, "/"))
          .filter(
            (t) =>
              t.includes("carousel_media") || t.includes("edge_sidecar_to_children")
          )
          .slice(0, 3),
      };
    });

    // ── Selección de las imágenes del post ──
    //
    // 1. Se sacan las fotos del carrusel desde el JSON embebido (en orden).
    // 2. Se descargan del CDN; si alguna falla, se busca en lo capturado.
    // 3. Si no hay carrusel, se usa el og:image o la imagen más pesada.
    const fotos = await seleccionarImagenes(crudo, imagenesCapturadas);

    if (fotos.length > 0) {
      crudo.imagenesEnVivo = fotos.map((f) => ({
        base64: f.buf.toString("base64"),
        tipo: f.tipo,
      }));
      // La primera foto del carrusel es la portada del evento.
      crudo.imagenEnVivo = crudo.imagenesEnVivo[0];
    }

    return crudo;
  } catch (error) {
    console.error(`[Extractor] Error visitando ${url}: ${error.message}`);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignorar
      }
    }
  }
}

/**
 * Datos de un video de YouTube vía oEmbed.
 *
 * oEmbed es la única vía que sigue abierta sin credenciales: devuelve el
 * título real del video, el canal y la miniatura. La página normal de
 * YouTube devuelve avisos de cookies y títulos como "Tráiler Oficial".
 *
 * NO sirve para Facebook ni Instagram: sus enlaces comprimidos
 * (facebook.com/share/...) redirigen a un muro de login y no existe oEmbed
 * público desde que Meta lo retiró.
 */
async function datosDeYouTube(url) {
  if (!/(?:youtube\.com|youtu\.be)/i.test(url)) return null;

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return null;

    const d = await res.json();

    // La miniatura que da oEmbed es de 480 px (hqdefault). Se pide la de
    // 1280 px (maxresdefault) para que se vea bien en la página.
    let miniatura = d.thumbnail_url || null;
    if (miniatura && /\/hqdefault\.jpg/.test(miniatura)) {
      const grande = miniatura.replace("/hqdefault.jpg", "/maxresdefault.jpg");
      try {
        const prueba = await fetch(grande, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
        });
        if (prueba.ok) miniatura = grande;
      } catch {
        // no hay versión grande; se queda la de 480 px
      }
    }

    return {
      titulo: d.title || null,
      autor: d.author_name || null,
      miniatura,
    };
  } catch {
    return null;
  }
}

// ─── Extracción principal ─────────────────────────────────────────────────

/**
 * Extrae los datos de un evento desde una URL y el texto del mensaje.
 *
 * @param {string} url
 * @param {string} textoMensaje - texto del mensaje de WhatsApp (opcional)
 * @returns {Promise<Object>} Datos con trazabilidad de fuentes
 */
async function extraerEvento(url, textoMensaje = "") {
  const crudo = await leerPagina(url);

  const fuentes = {};
  const advertencias = [];
  let afiche = null;

  // ── YouTube: se pide aparte, por oEmbed ──
  //
  // La página normal de YouTube no sirve: devuelve avisos de cookies y un
  // título poco útil ("Tráiler Oficial"). oEmbed es la única vía que sigue
  // abierta sin credenciales y da el título real, el canal y la miniatura.
  const youtube = crudo ? await datosDeYouTube(url) : null;

  // Si la página no dio ninguna imagen pero YouTube sí tiene miniatura, se
  // usa esa: es la portada real del video.
  if (
    crudo &&
    youtube &&
    youtube.miniatura &&
    (!crudo.imagenesEnVivo || crudo.imagenesEnVivo.length === 0)
  ) {
    const bajada = await descargarFoto(youtube.miniatura);
    if (bajada) {
      crudo.imagenesEnVivo = [
        { base64: bajada.buf.toString("base64"), tipo: bajada.tipo },
      ];
      crudo.imagenEnVivo = crudo.imagenesEnVivo[0];
      fuentes.imagenUrl = "youtube";
    }
  }

  const eventoJsonLd = crudo ? buscarEventoJsonLd(crudo.jsonLd) : null;
  if (eventoJsonLd) fuentes.jsonLd = true;

  // Página tras un muro de login: no hay nada que leer.
  //
  // Le pasa a los enlaces facebook.com/share/... (reels y publicaciones
  // compartidas), que redirigen a la pantalla de inicio de sesión. Se avisa
  // explícitamente para que el moderador no crea que el bot falló.
  if (crudo && crudo.esMuroDeLogin) {
    advertencias.push(
      "La página exige iniciar sesión (muro de login): no se pudo leer el contenido."
    );
  }

  // Aplicar la configuración del afiche y, si se puede, leerlo.
  //
  // El afiche es la fuente MÁS confiable de nombre, fecha y lugar: es lo
  // que el organizador publicó para anunciar el evento. Los metadatos de
  // la página (og:) suelen traer solo el texto de quien lo compartió.
  if (crudo && visionConfigurada()) {
    // Se mandan TODAS las fotos del carrusel (hasta el límite): en un
    // carrusel los datos del evento suelen estar repartidos entre láminas.
    const MAX_VISION = Number(process.env.MAX_FOTOS_AFICHE) || 10;
    afiche = await leerAfiche((crudo.imagenesEnVivo || []).slice(0, MAX_VISION));
  }

  // Si el afiche dice claramente que NO es un evento cultural, se anota.
  if (afiche && afiche.esEventoCultural === false) {
    advertencias.push("La IA considera que el afiche no anuncia un evento cultural.");
  }

  // ── Título ──
  // Se descartan los títulos genéricos ("Facebook", "Before you continue
  // to YouTube"...) porque no son el nombre del evento.
  let titulo = null;

  // El nombre REAL del evento suele estar dentro del afiche.
  if (afiche && typeof afiche.nombre === "string") {
    const limpio = limpiarTitulo(afiche.nombre);
    if (limpio && !esTituloGenerico(limpio)) {
      titulo = limpio;
      fuentes.titulo = "afiche";
    }
  }

  if (!titulo && eventoJsonLd && typeof eventoJsonLd.name === "string") {
    const limpio = limpiarTitulo(eventoJsonLd.name);
    if (limpio && !esTituloGenerico(limpio)) {
      titulo = limpio;
      fuentes.titulo = "json-ld";
    }
  }
  if (!titulo && crudo) {
    for (const [valor, fuente] of [
      [crudo.ogTitulo, "og"],
      [crudo.twitterTitulo, "twitter"],
      [youtube && youtube.titulo, "youtube"],
      [crudo.h1, "html"],
      [crudo.tituloDocumento, "html"],
    ]) {
      const limpio = limpiarTitulo(valor);
      if (limpio && !esTituloGenerico(limpio)) {
        titulo = limpio;
        fuentes.titulo = fuente;
        break;
      }
    }
  }
  // Último recurso: la primera línea útil del propio mensaje de WhatsApp.
  if (!titulo) {
    const desdeCaption = tituloDesdeCaption(textoMensaje);
    if (desdeCaption) {
      titulo = desdeCaption;
      fuentes.titulo = "caption";
    }
  }

  // ── Descripción ──
  let descripcion = null;
  if (eventoJsonLd && typeof eventoJsonLd.description === "string") {
    const limpia = eventoJsonLd.description.replace(/\s+/g, " ").trim();
    // Una descripción que es solo un enlace no aporta nada.
    if (limpia && !esSoloUrl(limpia)) {
      descripcion = limpia.slice(0, 2000);
      fuentes.descripcion = "json-ld";
    }
  }
  if (!descripcion) {
    const elegida = mejorDescripcion(
      textoMensaje,
      crudo ? crudo.ogDescripcion : null,
      crudo ? crudo.metaDescripcion || crudo.twitterDescripcion : null
    );
    if (elegida && elegida.valor) {
      descripcion = elegida.valor.slice(0, 2000);
      fuentes.descripcion = elegida.fuente;
    }
  }

  // ── Imagen ──
  let imagenUrl = null;
  if (eventoJsonLd) {
    imagenUrl = normalizarImagen(eventoJsonLd.image);
    if (imagenUrl) fuentes.imagenUrl = "json-ld";
  }
  if (!imagenUrl && crudo) {
    imagenUrl = crudo.ogImagen || crudo.twitterImagen || null;
    if (imagenUrl) fuentes.imagenUrl = crudo.ogImagen ? "og" : "twitter";
  }
  // YouTube: la portada real del video. La página en sí no la da porque
  // devuelve el aviso de cookies, pero oEmbed sí.
  if (!imagenUrl && youtube && youtube.miniatura) {
    imagenUrl = youtube.miniatura;
    fuentes.imagenUrl = "youtube";
  }
  if (imagenUrl) imagenUrl = imagenUrl.slice(0, 500);

  // ── Fechas ──
  let fecha = null;
  let fechaFin = null;
  let anioInferido = false;
  let tieneHora = false;

  if (eventoJsonLd && eventoJsonLd.startDate) {
    fecha = fechaDesdeIso(String(eventoJsonLd.startDate));
    if (fecha) fuentes.fecha = "json-ld";

    if (eventoJsonLd.endDate) {
      fechaFin = fechaDesdeIso(String(eventoJsonLd.endDate));
      if (fechaFin) fuentes.fechaFin = "json-ld";
    }

    if (fecha) {
      tieneHora = /T\d{2}:\d{2}/.test(String(eventoJsonLd.startDate));
    }
  }

  // La fecha muchas veces está SOLO en el afiche.
  // Se combina el texto de fecha con el de hora ("24 de septiembre de 2026"
  // + "desde las 20:00") y se normaliza con nuestro propio parser, que ya
  // maneja la zona horaria de Loja y la inferencia del año.
  if (!fecha && afiche) {
    const textoFecha = [afiche.fechaTexto, afiche.horaTexto]
      .filter((v) => typeof v === "string" && v.trim())
      .join(" ");

    const rango = textoFecha ? extraerRangoDeTexto(textoFecha) : null;

    if (rango) {
      fecha = rango.fecha;
      fechaFin = rango.fechaFin;
      anioInferido = rango.anioInferido;
      tieneHora = rango.tieneHora;
      fuentes.fecha = "afiche";
      if (fechaFin) fuentes.fechaFin = "afiche";

      if (anioInferido) {
        advertencias.push(
          `El afiche no indicaba el año; se asumió ${fecha.getUTCFullYear()}.`
        );
      }
    }

    // Si el afiche dice "hasta el X" y no se detectó fecha de fin, se usa.
    if (fecha && !fechaFin && typeof afiche.fechaFinTexto === "string") {
      const rangoFin = extraerRangoDeTexto(afiche.fechaFinTexto);
      if (rangoFin && rangoFin.fecha.getTime() > fecha.getTime()) {
        fechaFin = rangoFin.fecha;
        fuentes.fechaFin = "afiche";
      }
    }
  }

  if (!fecha) {
    // El texto del mensaje suele traer la fecha real del evento,
    // que es justo lo que OpenGraph no aporta.
    const rango = extraerRangoDeTexto(textoMensaje);
    if (rango) {
      fecha = rango.fecha;
      fechaFin = rango.fechaFin;
      anioInferido = rango.anioInferido;
      tieneHora = rango.tieneHora;
      fuentes.fecha = "caption";
      if (fechaFin) fuentes.fechaFin = "caption";

      if (anioInferido) {
        advertencias.push(
          `El mensaje no indicaba el año; se asumió ${fecha.getUTCFullYear()} según el calendario de Loja.`
        );
      }
    }
  }

  // ── Lugar ──
  let lugar = null;
  if (eventoJsonLd && eventoJsonLd.location) {
    lugar = normalizarLugar(eventoJsonLd.location);
    if (lugar) fuentes.lugar = "json-ld";
  }
  // El lugar del afiche suele ser más específico que el de la página.
  if (!lugar && afiche && typeof afiche.lugar === "string") {
    const limpio = limpiarLugar(afiche.lugar);
    if (limpio) {
      lugar = limpio;
      fuentes.lugar = "afiche";
    }
  }
  if (!lugar) {
    lugar = extraerLugarDeTexto(textoMensaje);
    if (lugar) fuentes.lugar = "caption";
  }
  // Último recurso: el texto visible de la página.
  //
  // Se exige que la página haya expuesto metadatos reales (og: o JSON-LD).
  // Sin esa condición el "lugar" salía de pantallas que NO son el evento: el
  // aviso de cookies de YouTube produjo el lugar "Acaba el Mapa".
  if (!lugar && crudo && crudo.textoVisible && (crudo.ogTitulo || eventoJsonLd)) {
    lugar = extraerLugarDeTexto(crudo.textoVisible.slice(0, 3000));
    if (lugar) fuentes.lugar = "html";
  }

  // ── Campos que faltan, para que el moderador los complete ──
  const camposFaltantes = [];
  if (!titulo) camposFaltantes.push("titulo");
  if (!descripcion) camposFaltantes.push("descripcion");
  if (!imagenUrl) camposFaltantes.push("imagenUrl");
  if (!fecha) camposFaltantes.push("fecha");
  if (!lugar) camposFaltantes.push("lugar");

  // ── Confianza ──
  // Mide qué tan completos y confiables son los datos, no si "parece evento".
  let confianza = 0;
  if (eventoJsonLd) confianza += 0.4;
  if (fuentes.fecha === "json-ld") confianza += 0.2;
  else if (fuentes.fecha === "caption") confianza += 0.1;
  if (fuentes.lugar === "json-ld") confianza += 0.15;
  else if (fuentes.lugar === "caption") confianza += 0.1;
  if (imagenUrl) confianza += 0.1;
  if (titulo) confianza += 0.1;
  if (descripcion) confianza += 0.05;
  confianza = Math.max(0, Math.min(1, Number(confianza.toFixed(2))));

  return {
    urlOriginal: url,
    titulo,
    descripcion,
    imagenUrl,
    // Imagen descargada dentro del navegador (evita el 403 de Instagram).
    // Si viene, se sube directamente a Bunny sin volver a descargarla.
    imagenEnVivo: crudo ? crudo.imagenEnVivo : null,
    // TODAS las fotos del carrusel, para guardar el post completo.
    imagenesEnVivo: crudo ? crudo.imagenesEnVivo || [] : [],
    fecha,
    fechaFin,
    lugar,
    tieneHora,
    fuentes,
    camposFaltantes,
    advertencias,
    confianza,
    jsonLdEncontrado: Boolean(eventoJsonLd),
    // Lo que la IA leyó del afiche (útil para auditar).
    afiche,
  };
}

/**
 * Compatibilidad: extrae la info de una sola URL.
 * @deprecated Usar `extraerEvento(url, textoMensaje)`, que aporta más contexto.
 */
async function extractEventInfo(url) {
  return extraerEvento(url, "");
}

// ─── Flujo completo: mensaje → posts en BD ────────────────────────────────

/**
 * Procesa un texto, visita sus URLs y guarda cada hallazgo como post pendiente.
 *
 * @param {string} text - Texto del mensaje de WhatsApp
 * @param {string} grupoId - Identificador del grupo
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<Array>} Posts creados
 */
async function extractAndProcessUrls(text, grupoId, prisma) {
  const urls = extractUrls(text);
  if (urls.length === 0) return [];

  console.log(`[Extractor] ${urls.length} URL(s) encontradas: ${urls.join(", ")}`);

  const posts = [];
  const descartados = [];

  for (const url of urls) {
    try {
      const datos = await extraerEvento(url, text);

      // Subir TODAS las fotos del carrusel a Bunny.
      //
      // Las fotos vienen del JSON del post y se descargaron del CDN en
      // `seleccionarImagenes`. Se suben una por una para quedarse con las
      // URLs permanentes y no depender de los enlaces firmados que caducan.
      const fotosPermanentes = [];
      if (bunnyConfigurado() && process.env.REHOSPEDAR_IMAGENES !== "false") {
        const fotos = datos.imagenesEnVivo?.length
          ? datos.imagenesEnVivo
          : datos.imagenEnVivo
            ? [datos.imagenEnVivo]
            : [];

        for (const foto of fotos) {
          const permanente = await rehospedarImagen(
            datos.imagenUrl,
            "whatsapp",
            foto
          );
          if (permanente) fotosPermanentes.push(permanente);
        }

        if (fotos.length > 1) {
          console.log(
            `[Extractor] Carrusel: ${fotosPermanentes.length}/${fotos.length} fotos guardadas en el CDN`
          );
        }
      }

      // Un post sin NADA no es un candidato: es ruido.
      //
      // Le pasa a los enlaces que dan muro de login (facebook.com/share/...):
      // no hay título, ni fecha, ni lugar, ni imagen. Guardarlos solo llena la
      // cola de moderación con filas vacías. Se cuentan aparte en el resumen.
      const tieneAlgo = Boolean(
        datos.titulo || datos.fecha || datos.lugar || (fotosPermanentes.length > 0)
      );

      if (!tieneAlgo) {
        descartados.push({ url, motivo: datos.advertencias[0] || "sin datos legibles" });
        console.log(`[Extractor] Descartado (sin datos): ${url}`);
        continue;
      }

      const post = await prisma.postSocial.create({
        data: {
          origen: "WHATSAPP_GRUPO",
          urlOriginal: datos.urlOriginal,
          textoOriginal: text ? text.slice(0, 5000) : null,
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          // La primera foto del carrusel es la portada.
          imagenUrl: fotosPermanentes[0] ?? datos.imagenUrl,
          // El carrusel completo, para que al aprobar vaya todo a la página.
          multimedia: fotosPermanentes.length > 1 ? fotosPermanentes : undefined,
          fechaPublicacion: datos.fecha,
          lugar: datos.lugar,
          estado: "PENDIENTE",
          grupoId: grupoId || null,
          confianzaIA: datos.confianza,
        },
      });

      posts.push({
        id: post.id,
        url,
        fuentes: datos.fuentes,
        camposFaltantes: datos.camposFaltantes,
        advertencias: datos.advertencias,
        confianza: datos.confianza,
        fotos: fotosPermanentes.length,
      });

      console.log(
        `[Extractor] Post #${post.id} creado — confianza ${datos.confianza}` +
          (datos.camposFaltantes.length
            ? ` — faltan: ${datos.camposFaltantes.join(", ")}`
            : " — completo")
      );
    } catch (err) {
      console.error(`[Extractor] Error procesando ${url}:`, err.message);
    }
  }

  if (descartados.length > 0) {
    console.log(`[Extractor] ${descartados.length} enlace(s) descartado(s) por no traer datos`);
  }

  return posts;
}

module.exports = {
  extractAndProcessUrls,
  extractUrls,
  extractEventInfo,
  extraerEvento,
  // Exportados para pruebas unitarias
  limpiarTitulo,
  esTituloGenerico,
  tituloDesdeCaption,
  esSoloUrl,
  limpiarLugar,
  extraerLugarDeTexto,
  buscarEventoJsonLd,
  aplanarJsonLd,
  esTipoEvento,
};
