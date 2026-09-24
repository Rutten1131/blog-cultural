/**
 * Volcado completo de los posts problemáticos: qué obtuvimos de cada enlace.
 *
 * Uso: npx tsx scripts/dump-problemas.ts
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
  const posts = await prisma.postSocial.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: [{ confianzaIA: "desc" }],
  });

  // Solo los que NO se pueden aprobar directo
  const problemas = posts.filter(
    (p) => !(p.titulo && p.fechaPublicacion && p.lugar)
  );

  console.log(`Posts que necesitan intervención humana: ${problemas.length}\n`);

  for (const p of problemas) {
    console.log("═".repeat(76));
    console.log(`#${p.id}   confianza ${p.confianzaIA}`);
    console.log(`URL       : ${p.urlOriginal}`);
    console.log(`Título    : ${p.titulo ?? "(nada)"}`);
    console.log(`Descripción: ${(p.descripcion ?? "(nada)").slice(0, 400)}`);
    console.log(`Texto msg : ${(p.textoOriginal ?? "(vacío)").replace(/\n/g, " ").slice(0, 200)}`);
    console.log();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
