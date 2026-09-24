/**
 * Diagnóstico: comprueba que el panel /admin pueda leer los posts del bot.
 *
 * Ejecuta EXACTAMENTE la misma consulta que `app/admin/page.tsx`, para
 * detectar problemas sin necesidad de iniciar sesión.
 *
 * Uso:
 *   npx tsx scripts/ver-posts-bot.ts
 */

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

async function main() {
  // Misma consulta que app/admin/page.tsx
  const postsBot = await prisma.postSocial.findMany({
    orderBy: [{ confianzaIA: "desc" }, { fechaDeteccion: "desc" }],
    take: 200,
  });

  console.log(`✅ La consulta del panel funciona. Posts leídos: ${postsBot.length}\n`);

  const porEstado = postsBot.reduce<Record<string, number>>((acc, p) => {
    acc[p.estado] = (acc[p.estado] ?? 0) + 1;
    return acc;
  }, {});

  console.log("=== POR ESTADO (lo que verás en /admin) ===");
  for (const [estado, n] of Object.entries(porEstado)) {
    console.log(`  ${estado}: ${n}`);
  }

  const pendientes = postsBot.filter((p) => p.estado === "PENDIENTE");
  const listos = pendientes.filter((p) => p.titulo && p.fechaPublicacion && p.lugar);
  const incompletos = pendientes.filter((p) => !(p.titulo && p.fechaPublicacion && p.lugar));

  console.log("\n=== UTILIDAD PARA MODERAR ===");
  console.log(`  Se pueden aprobar directo : ${listos.length}`);
  console.log(`  Necesitan que los completes: ${incompletos.length}`);

  console.log("\n=== PENDIENTES, ORDENADOS COMO EN EL PANEL ===");
  for (const p of pendientes) {
    const falta = [
      !p.titulo && "título",
      !p.fechaPublicacion && "fecha",
      !p.lugar && "lugar",
    ].filter(Boolean);

    const estado = falta.length === 0 ? "✅ listo" : `⚠️  falta ${falta.join(", ")}`;
    const titulo = (p.titulo ?? "(sin título)").slice(0, 58);
    console.log(
      `  #${String(p.id).padStart(2)}  ${String(Math.round((p.confianzaIA ?? 0) * 100)).padStart(3)}%  ${estado.padEnd(26)} ${titulo}`
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
