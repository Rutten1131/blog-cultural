import "dotenv/config";
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

const INSTITUCIONES_INICIALES = [
  {
    nombre: "Municipio de Loja Turismo",
    slug: "municipio-turismo",
    password: "turismo_loja2026",
  },
  {
    nombre: "Municipio de Loja Cultura",
    slug: "municipio-cultura",
    password: "cultura_loja2026",
  },
  {
    nombre: "Casa de la Cultura",
    slug: "casa-cultura",
    password: "cce_loja2026",
  },
  {
    nombre: "Universidad Tecnica Particular de Loja (UTPL)",
    slug: "utpl",
    password: "utpl_loja2026",
  },
  {
    nombre: "Prefectura de Loja",
    slug: "prefectura-loja",
    password: "prefectura_loja2026",
  },
  {
    nombre: "Universidad Nacional de Loja (UNL)",
    slug: "unl",
    password: "unl_loja2026",
  },
];

async function main() {
  console.log("🌱 Insertando instituciones iniciales...");
  for (const inst of INSTITUCIONES_INICIALES) {
    const res = await prisma.institucion.upsert({
      where: { nombre: inst.nombre },
      update: {
        slug: inst.slug,
        password: inst.password,
      },
      create: inst,
    });
    console.log(`✅ Institución: ${res.nombre} (Usuario: ${res.slug} | Clave: ${res.password})`);
  }
  console.log("🎉 Seed de instituciones completado.");
}

main()
  .catch((e) => {
    console.error("❌ Error al sembrar instituciones:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
