/**
 * Diagnóstico: ¿por qué falla la extracción en cada post?
 *
 * Muestra el texto original del mensaje para distinguir dos casos muy
 * distintos:
 *   a) El dato ESTÁ en el mensaje y no lo estamos leyendo → bug del parser.
 *   b) El dato NO está en el mensaje → no hay nada que arreglar, hace
 *      falta que un humano lo complete.
 *
 * Uso:
 *   npx tsx scripts/diagnostico-posts.ts
 *   npx tsx scripts/diagnostico-posts.ts 13   (un solo post)
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

/** Pistas de que el mensaje SÍ trae una fecha escrita. */
const PISTAS_FECHA =
  /\d{1,2}\s*(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\b\d{4}-\d{2}-\d{2}\b|\b(?:hoy|mañana|s[áa]bado|domingo|lunes|martes|mi[ée]rcoles|jueves|viernes)\b/i;

/** Pistas de que el mensaje SÍ trae un lugar escrito. */
const PISTAS_LUGAR = /📍|\b(?:lugar|ubicaci[óo]n|sede|direcci[óo]n|en el|en la)\b/i;

async function main() {
  const idFiltro = process.argv[2];

  const posts = await prisma.postSocial.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: [{ confianzaIA: "desc" }],
  });

  const objetivos = idFiltro
    ? posts.filter((p) => String(p.id) === idFiltro)
    : posts;

  let casoA = 0; // El dato está en el mensaje y no lo leemos  → arreglable
  let casoB = 0; // El dato no está en el mensaje            → necesita humano

  for (const p of objetivos) {
    const falta = [
      !p.titulo && "título",
      !p.fechaPublicacion && "fecha",
      !p.lugar && "lugar",
      !p.imagenUrl && "imagen",
    ].filter(Boolean) as string[];

    if (falta.length === 0) continue;

    const texto = p.textoOriginal ?? "";
    const tieneFecha = PISTAS_FECHA.test(texto);
    const tieneLugar = PISTAS_LUGAR.test(texto);

    console.log("─".repeat(78));
    console.log(`#${p.id}  falta: ${falta.join(", ")}   (confianza ${p.confianzaIA})`);
    console.log(`URL: ${(p.urlOriginal ?? "").slice(0, 70)}`);

    if (falta.includes("fecha")) {
      const veredicto = tieneFecha
        ? "🔧 CASO A — la fecha SÍ está en el mensaje, es un bug del parser"
        : "👤 CASO B — la fecha NO está en el mensaje";
      console.log(`  Fecha : ${veredicto}`);
      tieneFecha ? casoA++ : casoB++;
    }

    if (falta.includes("lugar")) {
      const veredicto = tieneLugar
        ? "🔧 CASO A — el lugar SÍ está en el mensaje, es un bug del parser"
        : "👤 CASO B — el lugar NO está en el mensaje";
      console.log(`  Lugar : ${veredicto}`);
      tieneLugar ? casoA++ : casoB++;
    }

    console.log(`\n  --- MENSAJE ORIGINAL (${texto.length} caracteres) ---`);
    console.log(
      texto
        .split("\n")
        .map((l) => "  " + l)
        .join("\n") || "  (vacío — solo se envió el enlace)"
    );
    console.log();
  }

  console.log("═".repeat(78));
  console.log(`RESUMEN DE CAMPOS QUE FALTAN`);
  console.log(`  🔧 Caso A (arreglable en el código): ${casoA}`);
  console.log(`  👤 Caso B (necesita un humano)     : ${casoB}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
