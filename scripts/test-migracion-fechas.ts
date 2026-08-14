/**
 * Test de la migración SQL contra la BD real.
 *
 * Para cada evento con fecha "00:00 UTC", valida que el día POST-migración
 * en zona Loja coincide con la fecha contenida en el slug.
 *
 * Ejecutar: npx tsx scripts/test-migracion-fechas.ts
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

function isoEcuador(d: Date): string {
  const lojaMs = d.getTime() - 5 * 3600 * 1000;
  return new Date(lojaMs).toISOString().slice(0, 10);
}

function horaUtc(d: Date): string {
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}:${d.getUTCSeconds().toString().padStart(2, "0")}`;
}

async function main() {
  const eventos = await prisma.evento.findMany({
    select: { id: true, nombre: true, slug: true, fecha: true, estado: true },
    orderBy: { fecha: "asc" },
  });

  const sospechosos = eventos.filter((e) => horaUtc(e.fecha) === "00:00:00");
  const horaDistinta = eventos.filter((e) => horaUtc(e.fecha) !== "00:00:00");

  console.log(`Total eventos: ${eventos.length}`);
  console.log(`Con hora UTC midnight (afectados): ${sospechosos.length}`);
  console.log(`Con otra hora (NO afectados): ${horaDistinta.length}`);
  console.log();

  if (sospechosos.length === 0) {
    console.log("✅ No hay filas que migrar. Nada que hacer.");
    return;
  }

  console.log("-".repeat(100));
  console.log(
    `${"ID".padStart(4)} | ${"ESTADO".padEnd(10)} | ${"SLUG FECHA".padEnd(12)} | ${"ANTES LOJA".padEnd(12)} | ${"DESPUES LOJA".padEnd(13)} | COINCIDE? | NOMBRE`
  );
  console.log("-".repeat(100));

  let pass = 0;
  let fail = 0;

  for (const e of sospechosos) {
    const match = e.slug.match(/(\d{4}-\d{2}-\d{2})/);
    const fechaSlug = match ? match[1] : null;

    const antesLoja = isoEcuador(e.fecha);

    const fechaNueva = new Date(e.fecha);
    fechaNueva.setUTCHours(17, 0, 0, 0);
    const despuesLoja = isoEcuador(fechaNueva);

    const coincide = fechaSlug === despuesLoja;
    if (coincide) pass++;
    else fail++;

    console.log(
      `${String(e.id).padStart(4)} | ${e.estado.padEnd(10)} | ${(fechaSlug ?? "???").padEnd(12)} | ${antesLoja.padEnd(12)} | ${despuesLoja.padEnd(13)} | ${coincide ? "SI" : "NO"}        | ${e.nombre.slice(0, 35)}`
    );
  }

  console.log();
  console.log("=".repeat(100));
  console.log(`Resultado: ${pass} pasan, ${fail} fallan`);
  if (fail > 0) {
    console.log(`   ${fail} filas NO coincidirian con el slug. Migracion NO segura para esas.`);
  } else {
    console.log(`   Todas las filas son corregibles. Migracion SEGURA.`);
  }

  // Test específico del bug original
  console.log();
  console.log("Test del evento 'Noches de ferias' (bug original)");
  const miEvento = await prisma.evento.findFirst({
    where: { slug: "noches-de-ferias-2026-08-14-teatro-el-dorado" },
  });
  if (miEvento) {
    const antesLoja = isoEcuador(miEvento.fecha);
    const fechaNueva = new Date(miEvento.fecha);
    fechaNueva.setUTCHours(17, 0, 0, 0);
    const despuesLoja = isoEcuador(fechaNueva);
    console.log(`   Antes (en Loja): ${antesLoja}`);
    console.log(`   Despues (en Loja): ${despuesLoja}`);
    if (despuesLoja === "2026-08-14") {
      console.log(`   El evento aparecera el 14/08 en la home (bug original corregido)`);
    } else {
      console.log(`   Aun no aparece el 14/08`);
    }
  }
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());