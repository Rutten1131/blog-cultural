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
  const ev = await prisma.evento.findUnique({ where: { id: 94 } });
  console.log('EVENTO_94:', JSON.stringify(ev, null, 2));
  const post = await prisma.postSocial.findUnique({ where: { id: 41 } });
  console.log('POST_41:', JSON.stringify(post, null, 2));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
