/**
 * TEMPORAL — borra los 4 posts repetidos (se borra después).
 *
 * Hace respaldo en archivo ANTES de borrar, y solo borra si siguen PENDIENTE
 * (si alguien aprobó uno mientras tanto, no se toca).
 *
 *   cd /root/whatsapp-worker && docker compose run --rm \
 *     --entrypoint node whatsapp-worker /app/scripts/tmp-borrar-duplicados.js
 */
require("dotenv").config({ path: "./.env" });
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const IDS = [10, 12, 14, 15];

// El contenedor corre como `nextjs` (uid 1001), así que no puede escribir en
// /app/scripts (montado :ro) ni bajo /root. Se prueban rutas escribibles y se
// aborta si no hay ninguna: el respaldo va SIEMPRE antes del borrado.
const RUTAS_RESPALDO = [
  "/respaldos/respaldo-duplicados-2026-09-24.json",
  "/tmp/respaldo-duplicados-2026-09-24.json",
];

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

  // ── 1. Respaldo ──
  const filas = await prisma.$queryRawUnsafe(
    `SELECT * FROM posts_social WHERE id IN (${IDS.join(",")}) ORDER BY id`
  );
  const json = JSON.stringify(
    filas,
    (k, v) => (typeof v === "bigint" ? Number(v) : v),
    2
  );

  let respaldo = null;
  for (const ruta of RUTAS_RESPALDO) {
    try {
      fs.writeFileSync(ruta, json);
      respaldo = ruta;
      break;
    } catch (err) {
      console.log(`(no se pudo escribir en ${ruta}: ${err.code || err.message})`);
    }
  }
  if (!respaldo) {
    console.log("❌ ABORTADO: no hay dónde guardar el respaldo. No se borra nada.");
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`=== RESPALDO en ${respaldo} (${filas.length} filas, ${json.length} bytes) ===`);
  for (const f of filas) {
    console.log(
      `#${f.id} · ${f.estado} · ${f.titulo?.slice(0, 40)} · fecha ${f.fechaPublicacion ? new Date(f.fechaPublicacion).toISOString().slice(0, 10) : "—"} · lugar ${f.lugar}`
    );
  }

  const antes = num((await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM posts_social`))[0].n);

  // ── 2. Borrado, solo si siguen pendientes ──
  console.log(`\n=== BORRANDO (solo si estado = PENDIENTE) ===`);
  const borrados = await prisma.$executeRawUnsafe(
    `DELETE FROM posts_social WHERE id IN (${IDS.join(",")}) AND estado = 'PENDIENTE'`
  );
  console.log(`rows affected: ${borrados}  ${borrados === 4 ? "✅ esperado 4" : "⚠️ NO son 4, revisar"}`);

  const despues = num((await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM posts_social`))[0].n);
  console.log(`Cola: ${antes} → ${despues}  ${despues === antes - 4 ? "✅" : "⚠️"}`);

  // ── 3. Cómo queda la cola ──
  console.log("\n=== LA COLA AHORA (orden del panel) ===");
  const cola = await prisma.$queryRawUnsafe(`
    SELECT id, confianzaIA, LEFT(COALESCE(urlOriginal,'(sin URL)'),44) AS url,
           DATE_FORMAT(fechaPublicacion,'%Y-%m-%d') AS fecha, LEFT(COALESCE(lugar,''),22) AS lugar,
           LEFT(COALESCE(titulo,''),34) AS titulo
    FROM posts_social ORDER BY confianzaIA DESC, fechaDeteccion DESC
  `);
  for (const f of cola) {
    console.log(
      `#${String(f.id).padStart(2)} · ${String(num(f.confianzaIA)).padEnd(4)} · ${String(f.fecha ?? "—").padEnd(10)} · ${String(f.lugar).padEnd(22)} · ${f.titulo}`
    );
  }

  const repetidos = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) AS n FROM (
      SELECT TRIM(TRAILING '/' FROM SUBSTRING_INDEX(SUBSTRING_INDEX(urlOriginal, '?', 1), '#', 1)) AS u
      FROM posts_social WHERE urlOriginal IS NOT NULL
      GROUP BY u HAVING COUNT(*) > 1
    ) t
  `);
  console.log(`\nGrupos con URL repetida que quedan: ${num(repetidos[0].n)} ${num(repetidos[0].n) === 0 ? "✅" : "⚠️"}`);

  await prisma.$disconnect();
})().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
