/**
 * Comprueba si la fecha/lugar que falta está en la DESCRIPCIÓN extraída
 * del enlace (no en el mensaje de WhatsApp).
 *
 * Caso típico: un post de Instagram. El mensaje de WhatsApp es solo el
 * enlace, pero el "caption" de Instagram (que sí trae fecha y lugar) llega
 * como descripción. El parser actual NO lo revisa.
 *
 * Uso: npx tsx scripts/verificar-descripcion.ts
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

const PISTAS_FECHA =
  /\d{1,2}\s*(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\b\d{4}-\d{2}-\d{2}\b/i;

const PISTAS_LUGAR = /📍|\b(?:lugar|ubicaci[óo]n|sede|direcci[óo]n)\s*:?/i;

async function main() {
  const posts = await prisma.postSocial.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: [{ confianzaIA: "desc" }],
  });

  let recuperablesFecha = 0;
  let recuperablesLugar = 0;

  for (const p of posts) {
    const falta = [
      !p.fechaPublicacion && "fecha",
      !p.lugar && "lugar",
    ].filter(Boolean) as string[];

    if (falta.length === 0) continue;

    const desc = p.descripcion ?? "";
    const fechaEnDesc = PISTAS_FECHA.test(desc);
    const lugarEnDesc = PISTAS_LUGAR.test(desc);

    if (!fechaEnDesc && !lugarEnDesc) continue;

    console.log("─".repeat(76));
    console.log(`#${p.id}  falta: ${falta.join(", ")}`);
    if (falta.includes("fecha") && fechaEnDesc) {
      console.log("  ✅ La FECHA está en la descripción del enlace → RECUPERABLE");
      recuperablesFecha++;
    }
    if (falta.includes("lugar") && lugarEnDesc) {
      console.log("  ✅ El LUGAR está en la descripción del enlace → RECUPERABLE");
      recuperablesLugar++;
    }
    console.log(`  Descripción: ${desc.slice(0, 300)}`);
    console.log();
  }

  console.log("═".repeat(76));
  console.log(`Fechas recuperables desde la descripción: ${recuperablesFecha}`);
  console.log(`Lugares recuperables desde la descripción: ${recuperablesLugar}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
