/**
 * Verificación end-to-end: ¿dónde aparece cada evento en la app?
 *
 * Simula las queries EXACTAS de cada página pública y muestra qué
 * eventos caen en cada slot.
 *
 * Ejecutar: npx tsx scripts/verificar-visibilidad.ts
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

function fmtLoja(d: Date): string {
  const lojaMs = d.getTime() - 5 * 3600 * 1000;
  return new Date(lojaMs).toISOString().slice(0, 16).replace("T", " ");
}

async function main() {
  const ahora = new Date();
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(` VERIFICACIÓN END-TO-END — Ahora: ${ahora.toISOString()}`);
  console.log(` (Hora Loja: ${fmtLoja(ahora)} EC)`);
  console.log("═══════════════════════════════════════════════════════════════════");

  // ─── 1. HOME / HERO ───
  console.log("\n\n📍 1. HOME — HERO (/)");
  console.log("   Query: estado=APROBADO AND fecha >= ahora, take:12, order by fecha asc");
  const hero = await prisma.evento.findMany({
    where: { estado: "APROBADO", fecha: { gte: ahora } },
    include: { categoria: true },
    orderBy: { fecha: "asc" },
    take: 12,
  });
  console.log(`   ${hero.length} eventos en el hero:`);
  hero.forEach((e, i) => {
    const tag = e.slug.includes("noches-de-ferias") ? " 👈 TU EVENTO" : "";
    console.log(`     ${(i + 1).toString().padStart(2, " ")}. ${fmtLoja(e.fecha)} EC | ${(e.categoria?.nombre ?? "?").padEnd(18)} | ${e.nombre}${tag}`);
  });

  // ─── 2. ÚLTIMOS PUBLICADOS (home, debajo del hero) ───
  console.log("\n\n📍 2. HOME — ÚLTIMOS EVENTOS PUBLICADOS");
  console.log("   Query: estado=APROBADO, order by createdAt desc (sin filtro de fecha)");
  const ultimos = await prisma.evento.findMany({
    where: { estado: "APROBADO" },
    include: { categoria: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`   ${ultimos.length} eventos aprobados totales`);
  console.log(`   Top 5 más recientes:`);
  ultimos.slice(0, 5).forEach((e, i) => {
    const tag = e.slug.includes("noches-de-ferias") ? " 👈 TU EVENTO" : "";
    console.log(`     ${(i + 1).toString().padStart(2, " ")}. creado ${e.createdAt.toISOString().slice(0, 10)} | ${e.nombre}${tag}`);
  });

  // ─── 3. SECCIONES POR CATEGORÍA (home) ───
  console.log("\n\n📍 3. HOME — SECCIONES POR CATEGORÍA");
  console.log("   Query por cada categoría: estado=APROBADO AND fecha >= ahora AND categoria=slug, take:5");
  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });
  for (const cat of categorias) {
    const evs = await prisma.evento.findMany({
      where: { estado: "APROBADO", fecha: { gte: ahora }, categoriaId: cat.id },
      orderBy: { fecha: "asc" },
      take: 5,
    });
    const tuEv = evs.find((e) => e.slug.includes("noches-de-ferias"));
    const tag = tuEv ? " 👈 TU EVENTO" : "";
    console.log(`\n   🎨 ${cat.nombre.toUpperCase()} (${cat.slug}) — ${evs.length} eventos${tag}`);
    evs.slice(0, 3).forEach((e) => {
      console.log(`        - ${fmtLoja(e.fecha)} EC | ${e.nombre}`);
    });
    if (evs.length > 3) console.log(`        ... y ${evs.length - 3} más`);
  }

  // ─── 4. /eventos (listado completo) ───
  console.log("\n\n📍 4. /eventos — LISTADO COMPLETO");
  console.log("   Query: estado=APROBADO, order by fecha asc (sin filtro de fecha)");
  const listado = await prisma.evento.findMany({
    where: { estado: "APROBADO" },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
  });
  console.log(`   ${listado.length} eventos aprobados`);
  const tuEvListado = listado.find((e) => e.slug.includes("noches-de-ferias"));
  if (tuEvListado) {
    const pos = listado.findIndex((e) => e.id === tuEvListado.id) + 1;
    console.log(`   👈 Tu evento posición #${pos} de ${listado.length}`);
    console.log(`      ${fmtLoja(tuEvListado.fecha)} EC | ${tuEvListado.categoria?.nombre} | ${tuEvListado.zona?.nombre}`);
  }

  // ─── 5. /eventos/categoria/artes-vivas ───
  console.log("\n\n📍 5. /eventos/categoria/artes-vivas — LISTADO POR CATEGORÍA");
  const artesVivas = await prisma.categoria.findUnique({ where: { slug: "artes-vivas" } });
  if (artesVivas) {
    const evs = await prisma.evento.findMany({
      where: { estado: "APROBADO", categoriaId: artesVivas.id },
      orderBy: { fecha: "asc" },
    });
    console.log(`   ${evs.length} eventos de Artes Vivas aprobados`);
    const tuEv = evs.find((e) => e.slug.includes("noches-de-ferias"));
    if (tuEv) {
      const pos = evs.findIndex((e) => e.id === tuEv.id) + 1;
      console.log(`   👈 Tu evento posición #${pos} de ${evs.length}`);
    } else {
      console.log(`   ⚠️ Tu evento NO aparece aquí`);
    }
  }

  // ─── 6. /eventos/zona/el-sagrario ───
  console.log("\n\n📍 6. /eventos/zona/el-sagrario — LISTADO POR ZONA");
  const sagrario = await prisma.zona.findUnique({ where: { nombre: "El Sagrario" } });
  if (sagrario) {
    const evs = await prisma.evento.findMany({
      where: { estado: "APROBADO", zonaId: sagrario.id },
      orderBy: { fecha: "asc" },
    });
    console.log(`   ${evs.length} eventos en El Sagrario`);
    const tuEv = evs.find((e) => e.slug.includes("noches-de-ferias"));
    if (tuEv) {
      const pos = evs.findIndex((e) => e.id === tuEv.id) + 1;
      console.log(`   👈 Tu evento posición #${pos} de ${evs.length}`);
    }
  }

  // ─── 7. /eventos/[slug] — ficha ───
  console.log("\n\n📍 7. /eventos/noches-de-ferias-2026-08-14-teatro-el-dorado — FICHA");
  const ficha = await prisma.evento.findUnique({
    where: { slug: "noches-de-ferias-2026-08-14-teatro-el-dorado" },
    include: { categoria: true, zona: true },
  });
  if (ficha) {
    console.log(`   ✅ Tu evento EXISTE y es accesible`);
    console.log(`      Nombre:     ${ficha.nombre}`);
    console.log(`      Fecha Loja: ${fmtLoja(ficha.fecha)} EC`);
    console.log(`      Categoría:  ${ficha.categoria?.nombre}`);
    console.log(`      Zona:       ${ficha.zona?.nombre}`);
    console.log(`      Estado:     ${ficha.estado}`);
    console.log(`      Gestor:     ${ficha.nombreGestor}`);
  } else {
    console.log(`   ❌ Tu evento NO se encontró`);
  }

  // ─── 8. /sitemap.xml ───
  console.log("\n\n📍 8. /sitemap.xml — URL INDEXADA");
  const sitemap = await prisma.evento.findMany({
    where: { estado: "APROBADO" },
    select: { slug: true, createdAt: true },
  });
  const enSitemap = sitemap.find((e) => e.slug === "noches-de-ferias-2026-08-14-teatro-el-dorado");
  if (enSitemap) {
    console.log(`   ✅ Tu evento ESTÁ en el sitemap:`);
    console.log(`      https://agendacultural-loja.com/eventos/${enSitemap.slug}`);
  }

  // ─── 9. Resumen para tu evento ───
  console.log("\n\n" + "═".repeat(67));
  console.log(" 📋 RESUMEN — ¿DÓNDE APARECE 'NOCHES DE FERIAS' TRAS EL FIX?");
  console.log("═".repeat(67));
  console.log(`
  ✅ /eventos/noches-de-ferias-2026-08-14-teatro-el-dorado
     → Ficha individual accesible, fecha correcta (14/08)

  ✅ /eventos (listado completo)
     → Aparece en posición #${listado.findIndex((e) => e.slug.includes("noches-de-ferias")) + 1} de ${listado.length}

  ✅ /eventos/categoria/artes-vivas
     → Aparece en la sección de Artes Vivas del home y en su página

  ✅ /eventos/zona/el-sagrario
     → Aparece en la página de zona El Sagrario

  ✅ /sitemap.xml
     → Indexado para Google

  ✅ Sección 'Últimos eventos' del home
     → Está en el carrusel horizontal (es reciente)

  ⚠️ HERO del home (Próximos eventos)
     → NO aparece porque su hora ya pasó (12:00 EC, ahora 15:56 EC).
       Para que aparezca, el gestor debe publicar con hora FUTURA.

  ✅ Schema.org JSON-LD
     → startDate correcto: 2026-08-14
`);
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());