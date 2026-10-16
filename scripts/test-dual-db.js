require('dotenv').config({ path: '.env.local' });
const { PrismaClient: PrismaMain } = require('@prisma/client');
const { PrismaClient: PrismaBot } = require('../node_modules/.prisma/bot-client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function testServices() {
  const urlMain = new URL(process.env.DATABASE_URL);
  const adapterMain = new PrismaMariaDb({
    host: urlMain.hostname,
    port: Number(urlMain.port) || 3306,
    user: decodeURIComponent(urlMain.username),
    password: decodeURIComponent(urlMain.password),
    database: urlMain.pathname.replace('/', ''),
  });
  const prismaMain = new PrismaMain({ adapter: adapterMain });

  const urlBot = new URL(process.env.CHATBOT_DB_URL);
  const adapterBot = new PrismaMariaDb({
    host: urlBot.hostname,
    port: Number(urlBot.port) || 3306,
    user: decodeURIComponent(urlBot.username),
    password: decodeURIComponent(urlBot.password),
    database: urlBot.pathname.replace('/', ''),
  });
  const prismaBot = new PrismaBot({ adapter: adapterBot });

  console.log('--- TEST 1: Eventos de Agenda Cultural (DB Principal) ---');
  const eventos = await prismaMain.evento.findMany({ take: 3, where: { estado: 'APROBADO' } });
  console.log('✅ Eventos obtenidos de agendaculturalbd:', eventos.length, eventos.map(e => e.nombre));

  console.log('--- TEST 2: Hospedaje de Botempresas (DB Bot Central) ---');
  const hoteles = await prismaBot.aliados.findMany({
    where: { activo: true, tipo: 'HOSPEDAJE' },
    take: 3,
    include: { aliado_habitaciones: true }
  });
  console.log('✅ Hoteles obtenidos de Botempresas:', hoteles.length, hoteles.map(h => `${h.nombre} (${h.aliado_habitaciones.length} habs)`));

  console.log('--- TEST 3: Gastronomía de Botempresas (DB Bot Central) ---');
  const restaurantes = await prismaBot.aliados.findMany({
    where: { activo: true, tipo: { in: ['GASTRONOMIA', 'CAFETERIA'] } },
    take: 3,
    include: { aliado_habitaciones: true }
  });
  console.log('✅ Restaurantes obtenidos de Botempresas:', restaurantes.length, restaurantes.map(r => r.nombre));

  console.log('--- TEST 4: Atractivos de Botempresas (DB Bot Central) ---');
  const atractivos = await prismaBot.atractivos_cantonales.findMany({
    where: { activo: true },
    take: 3
  });
  console.log('✅ Atractivos obtenidos de Botempresas:', atractivos.length, atractivos.map(a => `${a.nombre} (${a.canton})`));

  console.log('\n🎉 ¡TODAS LAS CONSULTAS DE TRANSICIÓN MULTI-DB FUNCIONAN AL 100%! 🎉');

  await prismaMain.$disconnect();
  await prismaBot.$disconnect();
}

testServices().catch(console.error);
