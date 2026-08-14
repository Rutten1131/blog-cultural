/**
 * Aplica la migración de fechas a la BD de producción.
 *
 * REGLA: solo actualiza filas con hora UTC = "00:00:00" que estén
 * desfasadas por el bug de zona horaria.
 *
 * Ejecutar: npx tsx scripts/aplicar-migracion-fechas.ts
 */

import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
// Cargar también .env (sin .local) por si la URL está ahí
dotenv.config({ path: ".env" });

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

function horaUtc(d: Date): string {
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}:${d.getUTCSeconds().toString().padStart(2, "0")}`;
}

function isoEcuador(d: Date): string {
  const lojaMs = d.getTime() - 5 * 3600 * 1000;
  return new Date(lojaMs).toISOString().slice(0, 10);
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  MIGRACIÓN DE FECHAS — Aplicación a producción");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`\n📍 Host: ${url.hostname}:${url.port || 3306}`);
  console.log(`📍 DB:   ${url.pathname.replace("/", "")}`);
  console.log("");

  // ── 1. Identificar filas afectadas ──
  const todos = await prisma.evento.findMany({
    select: { id: true, nombre: true, slug: true, fecha: true },
    orderBy: { id: "asc" },
  });
  const afectadas = todos.filter((e) => horaUtc(e.fecha) === "00:00:00");

  console.log(`📊 Total eventos: ${todos.length}`);
  console.log(`📊 Afectadas (hora UTC 00:00:00): ${afectadas.length}`);
  console.log("");

  if (afectadas.length === 0) {
    console.log("✅ No hay filas que migrar. Nada que hacer.");
    return;
  }

  // ── 2. Validar que la migración las lleva al día correcto (extraído del slug) ──
  console.log("─" + "─".repeat(80));
  console.log("VALIDACIÓN: día post-migración vs fecha en slug");
  console.log("─" + "─".repeat(80));

  const validas: typeof afectadas = [];
  const invalidas: { fila: typeof afectadas[0]; esperado: string; actual: string }[] = [];

  for (const f of afectadas) {
    const match = f.slug.match(/(\d{4}-\d{2}-\d{2})/);
    const fechaSlug = match ? match[1] : null;
    const fechaPost = new Date(f.fecha);
    fechaPost.setUTCHours(17, 0, 0, 0);
    const diaPostLoja = isoEcuador(fechaPost);

    if (fechaSlug === diaPostLoja) {
      validas.push(f);
    } else {
      invalidas.push({ fila: f, esperado: fechaSlug ?? "???", actual: diaPostLoja });
    }
  }

  console.log(`✅ Válidas (coinciden con slug): ${validas.length}`);
  console.log(`❌ Inválidas (no coinciden): ${invalidas.length}`);

  if (invalidas.length > 0) {
    console.log("\n⚠️  ATENCIÓN: Las siguientes filas NO se migrarán porque");
    console.log("   el slug no contiene una fecha que coincida con la fecha del evento:");
    for (const inv of invalidas) {
      console.log(`     #${inv.fila.id} "${inv.fila.nombre.slice(0, 40)}"`);
      console.log(`       slug dice: ${inv.esperado} | post-migración da: ${inv.actual}`);
    }
  }

  // ── 3. Aplicar UPDATE ──
  console.log("\n" + "─".repeat(82));
  console.log("APLICANDO UPDATE...");
  console.log("─".repeat(82));

  let updated = 0;
  for (const f of validas) {
    const antes = f.fecha.toISOString();
    const fechaNueva = new Date(f.fecha);
    fechaNueva.setUTCHours(17, 0, 0, 0);
    const despues = fechaNueva.toISOString();

    await prisma.evento.update({
      where: { id: f.id },
      data: { fecha: fechaNueva },
    });

    console.log(`  ✅ #${f.id.toString().padStart(3, " ")} ${antes} → ${despues} | ${f.nombre.slice(0, 50)}`);
    updated++;
  }

  console.log("\n" + "═".repeat(70));
  console.log(`📊 Resultado: ${updated} filas actualizadas de ${afectadas.length} detectadas`);
  console.log("═".repeat(70));

  // ── 4. Verificación post-migración ──
  console.log("\nVERIFICACIÓN POST-MIGRACIÓN");
  console.log("─".repeat(82));
  const verificacion = await prisma.evento.findMany({
    where: { id: { in: validas.map((v) => v.id) } },
    select: { id: true, nombre: true, slug: true, fecha: true },
    orderBy: { id: "asc" },
  });

  let okCount = 0;
  for (const v of verificacion) {
    const match = v.slug.match(/(\d{4}-\d{2}-\d{2})/);
    const fechaSlug = match ? match[1] : null;
    const diaPostLoja = isoEcuador(v.fecha);
    const horaPost = horaUtc(v.fecha);
    const ok = fechaSlug === diaPostLoja && horaPost === "17:00:00";
    if (ok) okCount++;
    console.log(`  ${ok ? "✅" : "❌"} #${v.id} hora=${horaPost} loja=${diaPostLoja} slug=${fechaSlug} | ${v.nombre.slice(0, 40)}`);
  }

  console.log(`\n📊 Verificación: ${okCount}/${verificacion.length} correctas`);

  // ── 5. Test específico del bug original ──
  console.log("\n" + "🎯".repeat(35));
  console.log("TEST DEL BUG ORIGINAL — 'Noches de ferias'");
  console.log("🎯".repeat(35));
  const miEvento = await prisma.evento.findFirst({
    where: { slug: "noches-de-ferias-2026-08-14-teatro-el-dorado" },
  });
  if (miEvento) {
    const dia = isoEcuador(miEvento.fecha);
    const hora = horaUtc(miEvento.fecha);
    console.log(`  Nombre: ${miEvento.nombre}`);
    console.log(`  Fecha en BD: ${miEvento.fecha.toISOString()}`);
    console.log(`  Día en Loja: ${dia}`);
    console.log(`  Hora UTC: ${hora}`);
    if (dia === "2026-08-14") {
      console.log(`  ✅ CORRECTO — El evento ahora aparece el 14/08 en la agenda`);
    } else {
      console.log(`  ❌ Aún incorrecto`);
    }
  }
}

main()
  .catch((e) => {
    console.error("\n❌ Error durante la migración:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());