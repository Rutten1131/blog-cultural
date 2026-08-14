/**
 * Test del caso "evento futuro hoy a las 20:00"
 *
 * Ejecutar: npx tsx scripts/test-caso-futuro.ts
 */

import * as _so from "server-only";
void _so;
import { parseFechaInputLocal, formatFechaLoja, formatFechaHoraLoja, esEventoPasado } from "../lib/fechas";

let pass = 0;
let fail = 0;

function test(label: string, expected: unknown, actual: unknown) {
  if (JSON.stringify(expected) === JSON.stringify(actual)) {
    pass++;
    console.log(`  OK ${label}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}`);
    console.log(`     esperado: ${JSON.stringify(expected)}`);
    console.log(`     actual:   ${JSON.stringify(actual)}`);
  }
}

console.log("\n🧪 Test: gestor quiere evento 'esta noche a las 20:00'\n");

const input = "2026-08-14T20:00";
const fecha = parseFechaInputLocal(input);

test("Input '2026-08-14T20:00' se guarda como 2026-08-15T01:00:00Z", "2026-08-15T01:00:00.000Z", fecha!.toISOString());
test("Mostrado en formato iso = 2026-08-14 (mismo día que el gestor)", "2026-08-14", formatFechaLoja(fecha!, "iso"));
test("Mostrado en formato fechaHora contiene '20:00'", true, /20:00/.test(formatFechaHoraLoja(fecha!, "medio")));

const futuro = new Date("2026-08-14T20:00:00-05:00"); // 20:00 Loja
test("¿Es evento pasado respecto a ahora?", false, esEventoPasado(futuro));

console.log("\n" + "=".repeat(60));
console.log(`📊 Resultado: ${pass} OK, ${fail} FAIL`);
if (fail > 0) process.exit(1);
console.log("Todos pasaron.");