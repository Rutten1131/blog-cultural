import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace("/", ""),
});
const prisma = new PrismaClient({ adapter });

async function checkImages() {
  const sinImagen = await prisma.evento.findMany({
    where: {
      OR: [
        { imagenUrl: null },
        { imagenUrl: "" },
      ],
    },
    select: {
      id: true,
      nombre: true,
      categoria: { select: { slug: true, nombre: true } },
      lugar: true,
    },
  });

  console.log(`\n========================================`);
  console.log(`EVENTOS SIN IMAGEN: ${sinImagen.length}`);
  console.log(`========================================`);
  sinImagen.forEach((e) => {
    console.log(`ID ${e.id}: "${e.nombre}" (${e.categoria?.nombre || "Sin cat."})`);
  });

  const todos = await prisma.evento.findMany({
    select: {
      id: true,
      nombre: true,
      imagenUrl: true,
      categoria: { select: { slug: true } },
    },
  });

  console.log(`\nTotal eventos en BD: ${todos.length}`);
  console.log(`Eventos con imagen: ${todos.filter((e) => e.imagenUrl).length}`);
  console.log(`========================================\n`);
}

checkImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
