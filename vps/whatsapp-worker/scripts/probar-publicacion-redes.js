const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
require('dotenv').config({ path: './.env' });

const databaseUrl = process.env.DATABASE_URL;
const url = new URL(databaseUrl);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\//, ''))
});

const prisma = new PrismaClient({ adapter });
const { programarPublicacionEnRedes } = require('../lib/redes-sociales-worker');

async function test() {
  console.log("Buscando último evento aprobado...");
  const ev = await prisma.evento.findFirst({
    where: { estado: 'APROBADO' },
    orderBy: { id: 'desc' }
  });

  if (!ev) {
    console.log("No se encontró ningún evento aprobado para la prueba.");
    process.exit(0);
  }

  console.log(`🚀 Probando publicación en redes con Evento #${ev.id}: "${ev.nombre}"`);
  const resultado = await programarPublicacionEnRedes(ev.id, prisma, { forzar: true });
  console.log("RESULTADO_TEST_REDES:", JSON.stringify(resultado, null, 2));
  process.exit(0);
}

test().catch(err => {
  console.error("ERROR EN TEST:", err);
  process.exit(1);
});
