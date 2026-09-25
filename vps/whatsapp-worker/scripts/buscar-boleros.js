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
  // Buscar eventos con "boleros" en el slug usando Prisma ORM
  const evs = await prisma.evento.findMany({
    where: { slug: { contains: "boleros" } },
    select: { id: true, slug: true, nombre: true, estado: true, nombreGestor: true, createdAt: true, imagenUrl: true },
    orderBy: { id: "asc" },
  });
  console.log("=== EVENTOS BOLEROS ===");
  for (const e of evs) {
    console.log(`ID: ${e.id} | Estado: ${e.estado} | Gestor: ${e.nombreGestor}`);
    console.log(`  Slug: ${e.slug}`);
    console.log(`  Nombre: ${e.nombre}`);
    console.log(`  Imagen: ${e.imagenUrl ? "SI" : "NO"}`);
    console.log("");
  }
  await prisma.$disconnect();
})();
