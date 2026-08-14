/**
 * Test funcional de lib/fechas.ts
 *
 * Se ejecuta con un alias de `server-only` → módulo vacío,
 * ya que el guard `import "server-only"` solo es válido dentro del
 * runtime de Next.js.
 *
 * Ejecutar: npx tsx scripts/test-fechas.ts
 */

// Stub de server-only para tests de Node (módulo vacío en runtime de Node)
import * as _serverOnly from "server-only";
void _serverOnly;

import {
  parseFechaInputLocal,
  formatFechaLoja,
  formatFechaHoraLoja,
  esEventoPasado,
  getDayBoundsLoja,
  TZ_LOJA,
} from "../lib/fechas";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function test(label: string, expected: unknown, actual: unknown) {
  const ok = JSON.stringify(expected) === JSON.stringify(actual);
  if (ok) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    failures.push(label);
    console.log(`  ❌ ${label}`);
    console.log(`     esperado: ${JSON.stringify(expected)}`);
    console.log(`     actual:   ${JSON.stringify(actual)}`);
  }
}

console.log("\n🧪 Test 1: parseFechaInputLocal (solo fecha = mediodía Loja)");
const f1 = parseFechaInputLocal("2026-08-14");
test("fecha 2026-08-14 → Date válido", true, f1 instanceof Date);
test("fecha 2026-08-14 → ISO UTC = 2026-08-14T17:00:00Z", "2026-08-14T17:00:00.000Z", (f1 as Date).toISOString());
test("fecha 2026-08-14 → timestamp = 1786726800000 (mediodía UTC)", 1786726800000, (f1 as Date).getTime());

console.log("\n🧪 Test 2: parseFechaInputLocal (datetime-local)");
const f2 = parseFechaInputLocal("2026-08-14T20:00");
test("2026-08-14T20:00 → ISO UTC = 2026-08-15T01:00:00Z", "2026-08-15T01:00:00.000Z", (f2 as Date).toISOString());
const f2b = parseFechaInputLocal("2026-08-14T20:30:00");
test("2026-08-14T20:30:00 → ISO UTC = 2026-08-15T01:30:00Z", "2026-08-15T01:30:00.000Z", (f2b as Date).toISOString());

console.log("\n🧪 Test 3: parseFechaInputLocal (inputs inválidos)");
test("string vacío → null", null, parseFechaInputLocal(""));
test("null → null", null, parseFechaInputLocal(null as unknown as string));
test("undefined → null", null, parseFechaInputLocal(undefined as unknown as string));
test("garbage → null", null, parseFechaInputLocal("ayer"));
test("formato latino → null", null, parseFechaInputLocal("14/08/2026"));

console.log("\n🧪 Test 4: formatFechaLoja (zona Loja forzada)");
const fechaUtc = new Date("2026-08-14T17:00:00.000Z");
test("mediodía UTC 2026-08-14 → formato medio contiene '14' y 'ago' y '2026'", true, /14.*ago.*2026/.test(formatFechaLoja(fechaUtc, "medio")));
test("mediodía UTC 2026-08-14 → formato iso = 2026-08-14", "2026-08-14", formatFechaLoja(fechaUtc, "iso"));
test("mediodía UTC 2026-08-14 → formato largo contiene 'agosto'", true, formatFechaLoja(fechaUtc, "largo").toLowerCase().includes("agosto"));

console.log("\n🧪 Test 5: formatFechaLoja — caso crítico del bug original");
const fechaUtcMedianoche = new Date("2026-08-14T00:00:00.000Z");
test("UTC midnight 2026-08-14 → formato iso = 2026-08-13 (día anterior en Loja)", "2026-08-13", formatFechaLoja(fechaUtcMedianoche, "iso"));

console.log("\n🧪 Test 6: formatFechaHoraLoja");
test("2026-08-14T01:00:00Z (20:00 Loja) → hora contiene '20:00'", true, /20:00/.test(formatFechaHoraLoja(new Date("2026-08-14T01:00:00.000Z"))));
test("2026-08-14T17:00:00Z (12:00 Loja) → hora contiene '12:00'", true, /12:00/.test(formatFechaHoraLoja(new Date("2026-08-14T17:00:00.000Z"))));

console.log("\n🧪 Test 7: esEventoPasado");
const ayer = new Date(Date.now() - 86400000);
const manana = new Date(Date.now() + 86400000);
test("ayer → true", true, esEventoPasado(ayer));
test("mañana → false", false, esEventoPasado(manana));
test("ayer (string ISO) → true", true, esEventoPasado(ayer.toISOString()));

console.log("\n🧪 Test 8: getDayBoundsLoja");
const bounds = getDayBoundsLoja(new Date("2026-08-14T20:00:00.000Z"));
test("bounds.inicio → 2026-08-14T05:00:00Z (00:00 Loja)", "2026-08-14T05:00:00.000Z", bounds!.inicio.toISOString());
test("bounds.fin → 2026-08-15T04:59:59.999Z (23:59 Loja)", "2026-08-15T04:59:59.999Z", bounds!.fin.toISOString());

console.log("\n🧪 Test 9: TZ_LOJA constante");
test("TZ_LOJA = 'America/Guayaquil'", "America/Guayaquil", TZ_LOJA);

console.log("\n🧪 Test 10: Simulación del evento del bug original");
const inputUsuario = "2026-08-14";
const fechaGuardada = parseFechaInputLocal(inputUsuario);
const fechaMostrada = formatFechaLoja(fechaGuardada!, "iso");
test("input '2026-08-14' se guarda como 2026-08-14T17:00:00Z", "2026-08-14T17:00:00.000Z", fechaGuardada!.toISOString());
test("input '2026-08-14' se muestra como '2026-08-14' (mismo día)", "2026-08-14", fechaMostrada);

console.log("\n" + "=".repeat(60));
console.log(`📊 Resultado: ${pass} pasaron, ${fail} fallaron`);
if (fail > 0) {
  console.log("\n❌ Tests fallidos:");
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log("✅ Todos los tests pasaron.");
}