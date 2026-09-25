/**
 * TEMPORAL — reabre los mensajes que quedaron marcados como procesados sin
 * haber producido nada (se borra después).
 *
 * Los afiches anteriores a la descarga de media quedaron marcados con 0 posts
 * y 0 URLs: `yaProcesado()` los salta para siempre. Al borrarlos se vuelven a
 * procesar en el próximo escaneo, ahora sí con la lectura del afiche.
 *
 * Reabre también mensajes de puro chat, pero se ignoran de nuevo sin costo.
 *
 *   cd /root/whatsapp-worker && docker compose run --rm \
 *     --entrypoint node whatsapp-worker /app/scripts/tmp-reabrir-procesados.js
 */
require("dotenv").config({ path: "./.env" });
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const env = (n) => {
  const v = process.env[n];
  return typeof v === "string" ? v.replace(/^"+|"+$/g, "") : v;
};
const num = (v) => (typeof v === "bigint" ? Number(v) : v);

function crearCliente() {
  const url = new URL(env("DATABASE_URL"));
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  });
  return new PrismaClient({ adapter });
}

(async () => {
  const prisma = crearCliente();
  const contar = async (sql) => num((await prisma.$queryRawUnsafe(sql))[0].n);

  const total = await contar(`SELECT COUNT(*) AS n FROM wa_mensajes_procesados`);
  const candidatos = await contar(
    `SELECT COUNT(*) AS n FROM wa_mensajes_procesados WHERE postsCreados = 0 AND urlsEncontradas = 0`
  );
  const conPosts = await contar(
    `SELECT COUNT(*) AS n FROM wa_mensajes_procesados WHERE postsCreados > 0 OR urlsEncontradas > 0`
  );

  console.log(`Filas en wa_mensajes_procesados: ${total}`);
  console.log(`· a reabrir (0 posts y 0 URLs): ${candidatos}`);
  console.log(`· se conservan (ya produjeron algo): ${conPosts}`);

  const postsAntes = await contar(`SELECT COUNT(*) AS n FROM posts_social`);
  console.log(`Posts en la cola antes: ${postsAntes}\n`);

  console.log("=== BORRANDO las filas sin resultado ===");
  const borrados = await prisma.$executeRawUnsafe(
    `DELETE FROM wa_mensajes_procesados WHERE postsCreados = 0 AND urlsEncontradas = 0`
  );
  console.log(`rows affected: ${borrados}`);

  const despues = await contar(`SELECT COUNT(*) AS n FROM wa_mensajes_procesados`);
  console.log(`Quedan: ${despues} filas (se conservan las que ya produjeron algo)`);

  await prisma.$disconnect();
})().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
