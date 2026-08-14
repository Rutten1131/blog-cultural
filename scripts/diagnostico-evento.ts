import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace("/", ""),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const ahora = new Date();
  console.log("🕐 AHORA (server):", ahora.toISOString(), "|", ahora.toString());
  console.log();

  const miEvento = await prisma.evento.findUnique({
    where: { slug: "noches-de-ferias-2026-08-14-teatro-el-dorado" },
    include: { categoria: true },
  });

  if (miEvento) {
    console.log("🎯 EVENTO BUSCADO:");
    console.log("  Nombre:", miEvento.nombre);
    console.log("  Fecha en BD:", miEvento.fecha.toISOString(), "|", miEvento.fecha.toString());
    console.log("  Estado:", miEvento.estado);
    console.log("  Creado:", miEvento.createdAt.toISOString());
    console.log();
    console.log("  ¿fecha >= ahora?", miEvento.fecha >= ahora);
    const diffMs = ahora.getTime() - miEvento.fecha.getTime();
    console.log("  Diferencia:", diffMs, "ms (", (diffMs / 3600000).toFixed(1), "horas )");
    console.log();
  }

  console.log("📊 HERO — destacados (take:12, fecha >= ahora, orden asc):");
  const hero = await prisma.evento.findMany({
    where: { estado: "APROBADO", fecha: { gte: ahora } },
    include: { categoria: true },
    orderBy: { fecha: "asc" },
    take: 12,
  });
  console.log("  Total que entran en hero:", hero.length, "/ 12 slots");
  hero.forEach((e, i) =>
    console.log(
      `  #${(i + 1).toString().padStart(2, " ")} | ${e.fecha.toISOString().slice(0, 16).replace("T", " ")} | ${(e.categoria?.nombre ?? "?").padEnd(15)} | ${e.nombre}`
    )
  );

  console.log();
  const eventosFuturos = await prisma.evento.findMany({
    where: { estado: "APROBADO", fecha: { gte: ahora } },
    orderBy: { fecha: "asc" },
  });
  console.log("📊 Eventos totales con fecha >= ahora:", eventosFuturos.length);
  const pos = eventosFuturos.findIndex((e) => e.slug === "noches-de-ferias-2026-08-14-teatro-el-dorado");
  console.log("   Posición de tu evento (sin take):", pos >= 0 ? pos + 1 : "FUERA DEL RANGO");
  console.log();

  console.log("🎭 ARTES VIVAS — take:5:");
  const av = await prisma.evento.findMany({
    where: { estado: "APROBADO", fecha: { gte: ahora }, categoria: { slug: "artes-vivas" } },
    include: { categoria: true },
    orderBy: { fecha: "asc" },
    take: 5,
  });
  console.log("  Total que entran:", av.length);
  av.forEach((e, i) =>
    console.log(`  #${i + 1} | ${e.fecha.toISOString().slice(0, 16).replace("T", " ")} | ${e.nombre}`)
  );
  const posAV = av.findIndex((e) => e.slug === "noches-de-ferias-2026-08-14-teatro-el-dorado");
  console.log("  Tu evento aparece en Artes Vivas?", posAV >= 0 ? `SÍ (#${posAV + 1})` : "NO");
}

main()
  .catch((e) => console.error("❌ Error:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });