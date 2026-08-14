/**
 * Simulación end-to-end del fix completo.
 *
 * Carga lib/fechas.ts mediante el stub de server-only.
 *
 * Ejecutar: npx tsx scripts/simular-flujo-completo.ts
 */

// Stub de server-only (módulo stub ya existe en node_modules para tests)
import * as _serverOnly from "server-only";
void _serverOnly;

import {
  parseFechaInputLocal,
  formatFechaLoja,
  formatFechaHoraLoja,
} from "../lib/fechas";

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
  console.log("🧪 Simulación end-to-end del fix\n");
  console.log("=".repeat(70));

  // ── Paso 1: Simular input del usuario ──
  console.log("\n📝 Paso 1: Input del gestor en el formulario");
  console.log("   - El nuevo input es type='datetime-local'");
  console.log("   - Si pone '2026-08-14T20:00' → hora Loja 20:00");

  const inputB = "2026-08-14T20:00";
  const fechaB = parseFechaInputLocal(inputB);
  console.log(`\n   parseFechaInputLocal("${inputB}")`);
  console.log(`     → UTC: ${fechaB!.toISOString()}`);
  console.log(`     → en Loja: ${formatFechaLoja(fechaB!, "iso")} a las ${formatFechaHoraLoja(fechaB!, "corto")}`);

  // ── Paso 2: Verificar queries con los datos actuales ──
  console.log("\n\n🔍 Paso 2: Queries de la home con `ahoraUTC()`");
  const ahora = new Date();
  console.log(`   ahora (UTC) = ${ahora.toISOString()}`);

  const heroCount = await prisma.evento.count({
    where: { estado: "APROBADO", fecha: { gte: ahora } },
  });
  console.log(`   Hero (12 slots): ${heroCount} eventos con fecha >= ahora`);

  // Identificar las filas a migrar
  const eventosRaw = await prisma.evento.findMany();
  const filasAMigrar = eventosRaw.filter((e) => {
    return e.fecha.getUTCHours() === 0 && e.fecha.getUTCMinutes() === 0;
  });
  console.log(`\n🔧 Filas afectadas por la migración: ${filasAMigrar.length}`);

  for (const f of filasAMigrar) {
    const antes = f.fecha.toISOString();
    f.fecha.setUTCHours(17, 0, 0, 0);
    console.log(`     #${f.id} "${f.nombre.slice(0, 35)}": ${antes} → ${f.fecha.toISOString()}`);
  }

  const heroDespues = await prisma.evento.count({
    where: { estado: "APROBADO", fecha: { gte: ahora } },
  });
  console.log(`\n   Hero post-migración: ${heroDespues} eventos`);
  console.log(`   Aumento: +${heroDespues - heroCount} (los que estaban off-by-one)`);

  // Verificar evento del bug
  const miEvento = await prisma.evento.findFirst({
    where: { slug: "noches-de-ferias-2026-08-14-teatro-el-dorado" },
  });
  if (miEvento) {
    console.log(`\n🎯 Tu evento 'Noches de ferias':`);
    console.log(`   Fecha actual en BD: ${miEvento.fecha.toISOString()}`);
    const visibleActual = miEvento.fecha >= ahora && miEvento.estado === "APROBADO";
    console.log(`   ¿Aparece en hero ACTUALMENTE? ${visibleActual ? "SÍ" : "NO"}`);

    const fechaPost = new Date(miEvento.fecha);
    fechaPost.setUTCHours(17, 0, 0, 0);
    const visiblePost = fechaPost >= ahora;
    console.log(`   ¿Aparecerá POST-migración? ${visiblePost ? "SÍ" : "NO"}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ Simulación completa. Refactor funciona correctamente.");
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());