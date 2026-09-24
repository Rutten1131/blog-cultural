/**
 * Seed script — carga los catálogos cerrados (categorías y zonas)
 * en la base de datos. Idempotente: usa upsert para no duplicar.
 *
 * Ejecutar: npx prisma db seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Prisma 7 requiere driver adapter
const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace("/", ""),
});

const prisma = new PrismaClient({ adapter });

const CATEGORIAS = [
  { slug: "arte-y-exposiciones", nombre: "Arte y exposiciones" },
  { slug: "teatro", nombre: "Teatro" },
  { slug: "musica", nombre: "Música" },
  { slug: "ferias", nombre: "Ferias" },
  { slug: "artes-vivas", nombre: "Artes Vivas" },
];

const ZONAS: { nombre: string; tipo: "URBANA" | "RURAL" }[] = [
  // Parroquias urbanas (6)
  { nombre: "El Sagrario", tipo: "URBANA" },
  { nombre: "Sucre", tipo: "URBANA" },
  { nombre: "El Valle", tipo: "URBANA" },
  { nombre: "San Sebastián", tipo: "URBANA" },
  { nombre: "Punzara", tipo: "URBANA" },
  { nombre: "Carigán", tipo: "URBANA" },
  // Parroquias rurales (13)
  { nombre: "Chantaco", tipo: "RURAL" },
  { nombre: "Chuquiribamba", tipo: "RURAL" },
  { nombre: "El Cisne", tipo: "RURAL" },
  { nombre: "Gualel", tipo: "RURAL" },
  { nombre: "Jimbilla", tipo: "RURAL" },
  { nombre: "Malacatos", tipo: "RURAL" },
  { nombre: "Quinara", tipo: "RURAL" },
  { nombre: "San Lucas", tipo: "RURAL" },
  { nombre: "San Pedro de Vilcabamba", tipo: "RURAL" },
  { nombre: "Santiago", tipo: "RURAL" },
  { nombre: "Taquil", tipo: "RURAL" },
  { nombre: "Vilcabamba", tipo: "RURAL" },
  { nombre: "Yangana", tipo: "RURAL" },
];

async function main() {
  console.log("🌱 Seeding categorías...");
  for (const cat of CATEGORIAS) {
    await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: { nombre: cat.nombre },
      create: cat,
    });
  }
  console.log(`   ✅ ${CATEGORIAS.length} categorías`);

  console.log("🌱 Seeding zonas...");
  for (const zona of ZONAS) {
    await prisma.zona.upsert({
      where: { nombre: zona.nombre },
      update: { tipo: zona.tipo },
      create: zona,
    });
  }
  console.log(`   ✅ ${ZONAS.length} zonas`);

  console.log("🎉 Seed completado.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
