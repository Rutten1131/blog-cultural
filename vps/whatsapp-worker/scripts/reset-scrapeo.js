/**
 * Borra los posts capturados y el registro de mensajes procesados,
 * para poder repetir el escaneo desde cero.
 *
 * Uso (dentro del contenedor):
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/reset-scrapeo.js --confirmar
 */

require("dotenv").config({ path: "./.env" });
const mariadb = require("mariadb");

function opciones() {
  const url = new URL(process.env.DATABASE_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    connectTimeout: 20000,
  };
}

async function main() {
  if (!process.argv.includes("--confirmar")) {
    console.error("Falta la bandera --confirmar. No se borró nada.");
    process.exit(1);
  }

  const conn = await mariadb.createConnection(opciones());

  const antesPosts = await conn.query("SELECT COUNT(*) AS n FROM `posts_social`");
  const antesMsgs = await conn.query(
    "SELECT COUNT(*) AS n FROM `wa_mensajes_procesados`"
  );

  console.log(`Antes: ${antesPosts[0].n} posts, ${antesMsgs[0].n} mensajes registrados`);

  await conn.query("TRUNCATE TABLE `posts_social`");
  await conn.query("TRUNCATE TABLE `wa_mensajes_procesados`");

  const despuesPosts = await conn.query("SELECT COUNT(*) AS n FROM `posts_social`");
  const despuesMsgs = await conn.query(
    "SELECT COUNT(*) AS n FROM `wa_mensajes_procesados`"
  );

  console.log(`Después: ${despuesPosts[0].n} posts, ${despuesMsgs[0].n} mensajes registrados`);
  console.log("Listo. Reiniciá el worker para que vuelva a escanear.");

  await conn.end();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
