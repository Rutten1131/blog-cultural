const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
require("dotenv").config({ path: "./.env" });

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
  const evs = await prisma.evento.findMany({
    where: { id: { in: [95, 97] } },
    select: {
      id: true,
      slug: true,
      nombre: true,
      descripcion: true,
      lugar: true,
      fecha: true,
      imagenUrl: true,
      nombreGestor: true,
      categoriaId: true,
      createdAt: true,
    },
  });
  console.log(JSON.stringify(evs, null, 2));
  await prisma.$disconnect();
})();
