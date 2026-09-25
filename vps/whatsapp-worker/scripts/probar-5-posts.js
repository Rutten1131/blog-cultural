/**
 * Prueba controlada de escaneo de 5 posts con el nuevo flujo:
 * 1. Lee mensajes de WhatsApp
 * 2. Procesa con el nuevo prompt de visión (sin marcas de prensa, título limpio, mejor imagen de carrusel)
 * 3. Ejecuta la Auto-Publicación si cumple con confianza >= 50% y los 4 datos obligatorios
 */
require("dotenv").config({ path: "./.env" });
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const {
  buscarMensajes,
  extraerTextoDeMensaje,
  esMensajeRelevante,
} = require("../lib/evolution-client");
const {
  extractAndProcessUrls,
  extractFromImage,
  extractFromTextOnly,
  extractUrls,
} = require("../lib/url-extractor");

const url = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\//, "")),
});
const prisma = new PrismaClient({ adapter });

(async () => {
  const grupos = (process.env.GRUPOS_SCRAPING || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (grupos.length === 0) {
    console.error("No hay grupos configurados en GRUPOS_SCRAPING.");
    process.exit(1);
  }

  const jid = grupos[0];
  console.log(`[TEST 5 POSTS] Iniciando escaneo en grupo: ${jid}`);

  const data = await buscarMensajes(jid, 1, 50);
  const registros = data.registros || [];
  console.log(`Mensajes recibidos del grupo: ${registros.length}`);

  let procesadosConExito = 0;
  const LIMITE_POSTS = 5;

  for (const msg of [...registros].reverse()) {
    if (procesadosConExito >= LIMITE_POSTS) {
      console.log(`\n🎉 SE COMPLETARON LOS ${LIMITE_POSTS} POSTS DE PRUEBA.`);
      break;
    }

    const mensajeId = msg?.key?.id;
    if (!mensajeId || !esMensajeRelevante(msg)) continue;

    const texto = extraerTextoDeMensaje(msg);
    const urls = texto ? extractUrls(texto) : [];
    const contenido = msg.message || {};

    let posts = [];
    if (urls.length > 0) {
      console.log(`\n--- Evaluando mensaje con URL: ${urls.join(", ")} ---`);
      posts = await extractAndProcessUrls(texto, jid, prisma);
    } else if (contenido.imageMessage) {
      console.log(`\n--- Evaluando afiche adjunto ---`);
      try {
        const post = await extractFromImage(msg, texto, jid, prisma);
        posts = post ? [post] : [];
      } catch (err) {
        console.warn("No se pudo leer afiche:", err.message);
      }
    } else if (texto && texto.trim().length > 20) {
      console.log(`\n--- Evaluando texto libre ---`);
      const post = await extractFromTextOnly(texto, jid, prisma);
      posts = post ? [post] : [];
    }

    if (posts && posts.length > 0) {
      procesadosConExito += posts.length;
      console.log(`Progreso: ${procesadosConExito} de ${LIMITE_POSTS} posts generados.`);
    }
  }

  // Ver resumen final de Eventos publicados
  const eventosPublicados = await prisma.evento.findMany({
    orderBy: { id: "desc" },
    take: 5,
    select: {
      id: true,
      nombre: true,
      slug: true,
      lugar: true,
      fecha: true,
      nombreGestor: true,
      imagenUrl: true,
      estado: true,
    },
  });

  console.log("\n=================================");
  console.log("ÚLTIMOS EVENTOS EN LA BASE DE DATOS:");
  console.log("=================================");
  console.log(JSON.stringify(eventosPublicados, null, 2));

  await prisma.$disconnect();
})();
