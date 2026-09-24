/**
 * Lista las URLs de las imágenes capturadas (las que están en Bunny).
 * Uso: npx tsx scripts/urls-imagenes.ts
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

  const conImagen = posts.filter((p) => p.imagenUrl);

  console.log(`Posts con imagen: ${conImagen.length}/${posts.length}\n`);

  for (const p of conImagen) {
    console.log(`#${p.id}  ${p.titulo?.slice(0, 45) ?? "(sin título)"}`);
    console.log(`      ${p.imagenUrl}\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
