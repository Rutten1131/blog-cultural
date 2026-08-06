/**
 * Script de verificación — consulta eventos desde la BD.
 * Ejecutar: npx tsx scripts/ver-eventos.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Cargar .env.local manualmente (dotenv/config solo carga .env)
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

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
  console.log("🔍 Consultando eventos en la base de datos...\n");

  const eventos = await prisma.evento.findMany({
    include: {
      categoria: true,
      zona: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (eventos.length === 0) {
    console.log("⚠️  No hay eventos registrados aún.");
  } else {
    console.log(`📌 Se encontraron ${eventos.length} evento(s):\n`);
    for (const e of eventos) {
      console.log(`─── ${e.nombre} ───`);
      console.log(`  Slug:       ${e.slug}`);
      console.log(`  Fecha:      ${e.fecha}`);
      console.log(`  Lugar:      ${e.lugar}`);
      console.log(`  Estado:     ${e.estado}`);
      console.log(`  Categoría:  ${e.categoria?.nombre ?? "(sin asignar)"}`);
      console.log(`  Zona:       ${e.zona?.nombre ?? "(sin asignar)"}`);
      console.log(`  Confianza:  ${e.confianzaClasificacion ?? "(sin clasificar)"}`);
      console.log(`  Gestor:     ${e.nombreGestor}`);
      console.log(`  Creado:     ${e.createdAt}`);
      console.log();
    }
  }

  console.log("\n🔍 Consultando catálogos...");
  const cats = await prisma.categoria.findMany();
  console.log(`  Categorías: ${cats.length} → ${cats.map(c => c.nombre).join(", ")}`);

  const zonas = await prisma.zona.findMany();
  console.log(`  Zonas: ${zonas.length} → ${zonas.map(z => z.nombre).join(", ")}`);
}

main()
  .catch((e) => {
    console.error("❌ Error al consultar:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
