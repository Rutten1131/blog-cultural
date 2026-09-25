require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const u = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: u.hostname,
  port: Number(u.port) || 3306,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: decodeURIComponent(u.pathname.replace(/^\//, '')),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const ferias = await prisma.categoria.findFirst({ where: { slug: 'ferias' } });
  const sanSeb = await prisma.zona.findFirst({ where: { nombre: 'San Sebastián' } });

  const actualizado = await prisma.evento.update({
    where: { id: 94 },
    data: {
      estado: 'APROBADO',
      categoriaId: ferias ? ferias.id : null,
      zonaId: sanSeb ? sanSeb.id : null,
    },
  });

  console.log('EVENTO_94_ACTUALIZADO:', JSON.stringify(actualizado, null, 2));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
