/**
 * Verifica el estado final de la BD y de tu evento específico.
 *
 * Ejecutar: npx tsx scripts/estado-final-bd.ts
 */

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
  const total = await prisma.evento.count();
  const aprobados = await prisma.evento.count({ where: { estado: "APROBADO" } });
  const pendientes = await prisma.evento.count({ where: { estado: "PENDIENTE" } });
  const rechazados = await prisma.evento.count({ where: { estado: "RECHAZADO" } });
  const cats = await prisma.categoria.count();
  const zonas = await prisma.zona.count();
  const catsAsignadas = await prisma.evento.count({ where: { categoriaId: { not: null } } });
  const zonasAsignadas = await prisma.evento.count({ where: { zonaId: { not: null } } });

  console.log("Estado de la BD:");
  console.log("  Total eventos:      ", total);
  console.log("  Aprobados:          ", aprobados);
  console.log("  Pendientes:         ", pendientes);
  console.log("  Rechazados:         ", rechazados);
  console.log("  Categorias en BD:   ", cats);
  console.log("  Zonas en BD:        ", zonas);
  console.log("  Eventos c/categoria:", catsAsignadas);
  console.log("  Eventos c/zona:     ", zonasAsignadas);

  const tuEv = await prisma.evento.findUnique({
    where: { slug: "noches-de-ferias-2026-08-14-teatro-el-dorado" },
  });
  if (tuEv) {
    console.log();
    console.log("Tu evento Noches de ferias:");
    console.log("  Estado:    ", tuEv.estado);
    console.log("  Fecha:     ", tuEv.fecha.toISOString());
    console.log("  Categoria: ", tuEv.categoriaId ? "asignada (id " + tuEv.categoriaId + ")" : "sin asignar");
    console.log("  Zona:      ", tuEv.zonaId ? "asignada (id " + tuEv.zonaId + ")" : "sin asignar");
    console.log("  Confianza: ", tuEv.confianzaClasificacion);
  }
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());