/**
 * Pruebas del motor de extracción — Worker de WhatsApp
 *
 * Ejecutar dentro del contenedor:
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/test-extractor.js
 *
 * Con una URL real (prueba de red + Puppeteer):
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/test-extractor.js https://ejemplo.com/evento
 */

const { extraerFechaDeTexto, extraerHoraDeTexto, extraerRangoDeTexto } = require("../lib/fechas-es");
const {
  extractUrls,
  limpiarLugar,
  extraerLugarDeTexto,
  limpiarTitulo,
  esTituloGenerico,
  tituloDesdeCaption,
  esSoloUrl,
  buscarEventoJsonLd,
} = require("../lib/url-extractor");

let pasaron = 0;
let fallaron = 0;

function check(nombre, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (ok) {
    pasaron++;
    console.log(`  OK   ${nombre}`);
  } else {
    fallaron++;
    console.log(`  FALLA ${nombre}`);
    console.log(`        esperado: ${JSON.stringify(esperado)}`);
    console.log(`        real:     ${JSON.stringify(real)}`);
  }
}

/** Formatea un Date a ISO UTC, o null. */
function iso(d) {
  return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : null;
}

function hora(texto) {
  return extraerHoraDeTexto(texto);
}

function fecha(texto) {
  const r = extraerFechaDeTexto(texto);
  return r ? { fecha: iso(r.fecha), anioInferido: r.anioInferido, tieneHora: r.tieneHora } : null;
}

console.log("\n=== 1. Horas en español ===");
check('"19h00"', hora("Empieza 19h00"), { hh: 19, mm: 0 });
check('"20:30"', hora("a las 20:30"), { hh: 20, mm: 30 });
check('"7:00 pm"', hora("7:00 pm"), { hh: 19, mm: 0 });
check('"9 pm"', hora("Concierto 9 pm"), { hh: 21, mm: 0 });
check('"19 horas"', hora("a las 19 horas"), { hh: 19, mm: 0 });
check("sin hora", hora("Teatro Bolívar"), null);
check("no confunde fecha con hora", hora("2026-10-20"), null);

console.log("\n=== 2. Fechas — solo día (debe quedar 17:00 UTC = mediodía Loja) ===");
// El año actual en Loja al momento de esta prueba es 2026.
check(
  '"20 de octubre de 2026"',
  fecha("20 de octubre de 2026"),
  { fecha: "2026-10-20T17:00:00.000Z", anioInferido: false, tieneHora: false }
);
check(
  '"20/10/2026"',
  fecha("Fecha: 20/10/2026"),
  { fecha: "2026-10-20T17:00:00.000Z", anioInferido: false, tieneHora: false }
);
check(
  '"2026-10-20" (ISO)',
  fecha("evento 2026-10-20"),
  { fecha: "2026-10-20T17:00:00.000Z", anioInferido: false, tieneHora: false }
);

console.log("\n=== 3. Fechas con hora (hora Loja → UTC con offset -05:00) ===");
// 19:00 en Loja = 00:00 UTC del día siguiente
check(
  '"4 de octubre de 2026 a las 19h00"',
  fecha("4 de octubre de 2026 a las 19h00"),
  { fecha: "2026-10-05T00:00:00.000Z", anioInferido: false, tieneHora: true }
);
// 10:00 en Loja = 15:00 UTC del mismo día
check(
  '"11 de noviembre de 2026, 10:00"',
  fecha("11 de noviembre de 2026, 10:00"),
  { fecha: "2026-11-11T15:00:00.000Z", anioInferido: false, tieneHora: true }
);

console.log("\n=== 4. Año inferido (el mensaje no lo dice) ===");
const futuro = fecha("15 de diciembre, 18h00");
check("marca anioInferido = true", futuro && futuro.anioInferido, true);
check("usa el año actual de Loja", futuro && futuro.fecha.startsWith("2026-12-"), true);

// Hoy es 2026-09-24. "10 de enero" ya pasó hace más de 30 días → debe saltar a 2027.
const pasado = fecha("10 de enero");
check(
  "fecha muy pasada salta al año siguiente",
  pasado && pasado.fecha.startsWith("2027-01-"),
  true
);

console.log("\n=== 5. Fechas inválidas ===");
check('"30 de febrero"', fecha("30 de febrero"), null);
check('"texto sin fecha"', fecha("Hola, ¿cómo están?"), null);
check('"99/99/2026"', fecha("99/99/2026"), null);

console.log("\n=== 6. Lugares — debe descartar basura ===");
check('"en el Teatro Bolívar"', extraerLugarDeTexto("Presentación en el Teatro Bolívar"), "Teatro Bolívar");
check(
  '"Lugar: Casa de la Cultura"',
  extraerLugarDeTexto("Lugar: Casa de la Cultura Ecuatoriana"),
  "Casa de la Cultura Ecuatoriana"
);
check(
  '"en el año 2024" → null',
  extraerLugarDeTexto("Este evento se realiza en el año 2024"),
  null
);
check(
  '"en esta ocasión" → null',
  extraerLugarDeTexto("en esta ocasión especial"),
  null
);
check('"19h00" como lugar → null', limpiarLugar("19h00"), null);
check('"4 de octubre" como lugar → null', limpiarLugar("4 de octubre"), null);
check('"el" como lugar → null', limpiarLugar("el"), null);

console.log("\n=== 7. Títulos — quitar sufijo de marca ===");
check(
  '"Festival | NombreDelSitio"',
  limpiarTitulo("Festival de Música de Loja | Diario La Hora"),
  "Festival de Música de Loja"
);
check("título corto se conserva", limpiarTitulo("Concierto"), "Concierto");

console.log("\n=== 8. URLs dentro de un mensaje real de WhatsApp ===");
const mensaje = `🎭 *AGENDA CULTURAL*
Sábado 4 de octubre, 19h00
Lugar: Teatro Bolívar
Más info: https://example.com/evento-uno y https://example.com/evento-dos.
También escrito como www.example.com/evento-tres,`;

check("extrae 3 URLs y limpia la puntuación final", extractUrls(mensaje), [
  "https://example.com/evento-uno",
  "https://example.com/evento-dos",
  "https://www.example.com/evento-tres",
]);

console.log("\n=== 9. JSON-LD schema.org/Event ===");
const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "Sitio" },
    {
      "@type": "MusicEvent",
      name: "Concierto de la Orquesta Sinfónica",
      startDate: "2026-11-20T20:00:00-05:00",
      endDate: "2026-11-20T22:30:00-05:00",
      description: "Concierto de temporada en el Teatro Bolívar.",
      image: [{ url: "https://example.com/foto.jpg" }],
      location: {
        "@type": "Place",
        name: "Teatro Bolívar",
        address: { streetAddress: "Calle Bolívar", addressLocality: "Loja" },
      },
    },
  ],
});

const ev = buscarEventoJsonLd([jsonLd]);
check("encuentra el nodo Event aunque esté en @graph", ev !== null, true);
check("lee el nombre", ev && ev.name, "Concierto de la Orquesta Sinfónica");
check("lee la fecha de inicio", ev && ev.startDate, "2026-11-20T20:00:00-05:00");

console.log("\n=== 10. Rango de fechas ===");
const rango = extraerRangoDeTexto("Del 4 al 6 de octubre de 2026");
check("inicio", rango && iso(rango.fecha), "2026-10-04T17:00:00.000Z");
check("fin", rango && iso(rango.fechaFin), "2026-10-06T17:00:00.000Z");

// ─── Mensaje real del grupo que reveló los fallos ───
console.log("\n=== 11. Mensaje REAL del grupo (regresión) ===");

const MENSAJE_REAL = `Gracias a la cobertura de Diario La Crónica 🇪🇨 #SonEspecial || vuelve a la Iglesia Catedral 🎶

Porque la segunda vez es mejor, te esperamos nuevamente para disfrutar de una velada llena de música, emoción e inclusión. ❤️

📅 24 de septiembre de 2026
🕗 20h00
📍 Iglesia Catedral
🎟️ Apto para todo público

#LojaEsArteYCultura 🖌️🤹🏻‍♂️
#DianaGuayanayAlcaldesaDeLoja

https://www.facebook.com/share/p/19u3NZjyK3/?mibextid=wwXIfr`;

check(
  "detecta el lugar con emoji 📍",
  extraerLugarDeTexto(MENSAJE_REAL),
  "Iglesia Catedral"
);
check(
  "detecta fecha 24 sep 2026 20h00 Loja → UTC",
  (() => {
    const f = extraerFechaDeTexto(MENSAJE_REAL);
    return f ? iso(f.fecha) : null;
  })(),
  "2026-09-25T01:00:00.000Z"
);

console.log("\n=== 12. Títulos genéricos (Facebook, YouTube) ===");
check('"Facebook" es genérico', esTituloGenerico("Facebook"), true);
check('"Instagram" es genérico', esTituloGenerico("Instagram"), true);
check(
  '"Before you continue to YouTube" es genérico',
  esTituloGenerico("Before you continue to YouTube"),
  true
);
check(
  '"Concierto de la Sinfónica" NO es genérico',
  esTituloGenerico("Concierto de la Sinfónica"),
  false
);

const t = tituloDesdeCaption(MENSAJE_REAL);
check(
  "saca un título usable del mensaje cuando el enlace no aporta",
  Boolean(t) && t.length >= 10,
  true
);
console.log(`        → título obtenido: "${t}"`);

console.log("\n=== 13. Lugares basura (pantallas de login) ===");
check('"Sign" → null', limpiarLugar("Sign"), null);
check('"Sign in" → null', limpiarLugar("Sign in"), null);
check('"Log in" → null', limpiarLugar("Log in"), null);
check('"Facebook" → null', limpiarLugar("Facebook"), null);

// ─── Casos reales detectados en producción ───
console.log("\n=== 14. Títulos basura vistos en datos reales ===");
check('"Ordner – Google Drive" es genérico', esTituloGenerico("Ordner – Google Drive"), true);
check('"Google Drive" es genérico', esTituloGenerico("Google Drive"), true);
check('"YouTube" es genérico', esTituloGenerico("YouTube"), true);
check(
  '"TUCUMÁN Grupo de Danza Pluricultural" NO es genérico',
  esTituloGenerico("TUCUMÁN Grupo de Danza Pluricultural"),
  false
);
check(
  '"Loja es Arte y Cultura" NO es genérico',
  esTituloGenerico("Loja es Arte y Cultura"),
  false
);

console.log("\n=== 15. Descripciones que solo son una URL ===");
check(
  "descripción que es solo el enlace",
  esSoloUrl("https://www.facebook.com/share/p/1dD9jNwE4m/"),
  true
);
check("descripción vacía", esSoloUrl(""), true);
check(
  "descripción real de un evento",
  esSoloUrl(
    "Te invitamos a la exposición de arte plástico Entre lo concreto y lo invisible en el Teatro Bolívar"
  ),
  false
);

console.log(`\n─────────────────────────────────────────`);
console.log(`Resultado: ${pasaron} OK, ${fallaron} FALLA`);

// ─── Prueba opcional con URL real ─────────────────────────────────────────
const url = process.argv[2];
if (url) {
  console.log(`\n=== 11. Prueba real contra: ${url} ===`);
  const { extraerEvento } = require("../lib/url-extractor");

  extraerEvento(url, process.env.TEXTO_MENSAJE || "")
    .then((d) => {
      console.log("\nResultado de la extracción:");
      // No volcar el base64 de la imagen: son megabytes de texto.
      const resumido = {
        ...d,
        imagenEnVivo: d.imagenEnVivo
          ? {
              tipo: d.imagenEnVivo.tipo,
              pesoKB: Math.round((d.imagenEnVivo.base64.length * 3) / 4 / 1024),
            }
          : null,
      };
      console.log(JSON.stringify(resumido, null, 2));

      console.log("\nResumen:");
      console.log(`  JSON-LD encontrado : ${d.jsonLdEncontrado}`);
      console.log(`  Título             : ${d.titulo}`);
      console.log(`  Fecha              : ${d.fecha ? d.fecha.toISOString() : "(no detectada)"}`);
      console.log(`  Lugar              : ${d.lugar}`);
      console.log(`  Imagen             : ${d.imagenUrl}`);
      console.log(
        `  Imagen capturada   : ${
          d.imagenEnVivo
            ? `${d.imagenEnVivo.tipo} (${Math.round((d.imagenEnVivo.base64.length * 3) / 4 / 1024)} KB, lista para subir a Bunny)`
            : "no"
        }`
      );
      console.log(`  Confianza          : ${d.confianza}`);
      console.log(`  Fuentes            : ${JSON.stringify(d.fuentes)}`);
      console.log(`  Faltan             : ${d.camposFaltantes.join(", ") || "(ninguno)"}`);
      if (d.advertencias.length) {
        console.log(`  Advertencias       : ${d.advertencias.join(" | ")}`);
      }
    })
    .catch((e) => {
      console.error("Error en la prueba real:", e);
      process.exitCode = 1;
    });
}

if (fallaron > 0) process.exitCode = 1;
