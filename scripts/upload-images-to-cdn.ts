/**
 * Script para subir las imágenes generadas a Bunny.net CDN
 * y actualizar los eventos en la base de datos con las URLs del CDN.
 *
 * Ejecución: npx tsx scripts/upload-images-to-cdn.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace("/", ""),
});
const prisma = new PrismaClient({ adapter });

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE!;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY!;
const BUNNY_PULL_ZONE_URL = process.env.BUNNY_PULL_ZONE_URL!.replace(/\/$/, "");

// Mapa: nombre parcial del slug del evento → ruta de imagen local
const IMAGES_DIR = `C:\\Users\\Smart\\.gemini\\antigravity-ide\\brain\\1bcd45b3-b0cf-4c5b-a157-269f8a09d649`;

interface ImageMapping {
  slugContains: string;
  localFile: string;
  cdnFileName: string;
}

const IMAGE_MAPPINGS: ImageMapping[] = [
  {
    slugContains: "feria-del-libro-carlos-carrion",
    localFile: "feria_libro_carrion_1787161751177.jpg",
    cdnFileName: "eventos/feria-libro-carrion.webp",
  },
  {
    slugContains: "gala-de-homenaje-carlos-carrion",
    localFile: "homenaje_carrion_1787161777138.jpg",
    cdnFileName: "eventos/homenaje-carrion-espejo.webp",
  },
  {
    slugContains: "presentacion-craneo-de-mar",
    localFile: "craneo_mar_escanzel_1787161801862.jpg",
    cdnFileName: "eventos/craneo-mar-escanzel.webp",
  },
  {
    slugContains: "recital-poetico-las-quina",
    localFile: "recital_poetico_1787161829099.jpg",
    cdnFileName: "eventos/recital-quina-poetica.webp",
  },
  {
    slugContains: "exposicion-plastica-palimpsesto",
    localFile: "exposicion_palimpsesto_1787161857165.jpg",
    cdnFileName: "eventos/exposicion-palimpsesto-cuenca.webp",
  },
  {
    slugContains: "relicarios-guardianes",
    localFile: "relicarios_memoria_1787161891610.jpg",
    cdnFileName: "eventos/relicarios-guardianes-memoria.webp",
  },
];

async function uploadToBunny(localPath: string, cdnFileName: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);

  const bunnyUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${cdnFileName}`;

  console.log(`   📤 Subiendo a ${bunnyUrl} (${(fileBuffer.length / 1024).toFixed(0)} KB)...`);

  const res = await fetch(bunnyUrl, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Bunny upload failed (${res.status}): ${errText}`);
  }

  const publicUrl = `${BUNNY_PULL_ZONE_URL}/${cdnFileName}`;
  console.log(`   ✅ CDN URL: ${publicUrl}`);
  return publicUrl;
}

async function main() {
  console.log("🚀 Subiendo imágenes generadas a Bunny.net CDN...\n");

  let uploaded = 0;
  let updated = 0;

  for (const mapping of IMAGE_MAPPINGS) {
    const localPath = path.join(IMAGES_DIR, mapping.localFile);

    if (!fs.existsSync(localPath)) {
      console.log(`⚠️ Archivo no encontrado: ${mapping.localFile}, saltando...`);
      continue;
    }

    console.log(`\n📁 Procesando: ${mapping.localFile}`);

    // 1. Subir a Bunny CDN
    const cdnUrl = await uploadToBunny(localPath, mapping.cdnFileName);
    uploaded++;

    // 2. Buscar evento por slug parcial
    const eventos = await prisma.evento.findMany({
      where: {
        slug: { contains: mapping.slugContains },
      },
    });

    for (const evento of eventos) {
      await prisma.evento.update({
        where: { id: evento.id },
        data: {
          imagenUrl: cdnUrl,
          multimedia: JSON.stringify([cdnUrl]),
        },
      });
      updated++;
      console.log(`   🔄 Actualizado evento: "${evento.nombre}" → ${cdnUrl}`);
    }
  }

  console.log(`\n🎉 Proceso completado:`);
  console.log(`   - Imágenes subidas al CDN: ${uploaded}`);
  console.log(`   - Eventos actualizados en BD: ${updated}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
