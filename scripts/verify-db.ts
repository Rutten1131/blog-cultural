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

async function verify() {
  const total = await prisma.evento.count();
  const aprobados = await prisma.evento.count({ where: { estado: "APROBADO" } });
  const ultimos = await prisma.evento.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nombre: true,
      lugar: true,
      fecha: true,
      estado: true,
      nombreGestor: true,
      categoria: { select: { nombre: true } },
      zona: { select: { nombre: true } },
    },
  });

  console.log(`\n========================================`);
  console.log(`TOTAL EVENTOS EN BD: ${total}`);
  console.log(`EVENTOS APROBADOS:   ${aprobados}`);
  console.log(`========================================\n`);
  console.log(`ÚLTIMOS EVENTOS REGISTRADOS:`);
  ultimos.forEach((e, idx) => {
    console.log(`${idx + 1}. [${e.categoria?.nombre || "Sin cat."}] ${e.nombre}`);
    console.log(`   📍 ${e.lugar} (${e.zona?.nombre || "Sin zona"}) | 📅 ${e.fecha.toISOString().split("T")[0]}`);
  });
  console.log(`\n========================================\n`);
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
