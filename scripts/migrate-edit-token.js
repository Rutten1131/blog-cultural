/**
 * Migración: agrega columnas edit_token y edit_token_expires_at a la tabla eventos.
 * Se ejecuta una sola vez. Es seguro re-ejecutar (IF NOT EXISTS).
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRaw`ALTER TABLE eventos ADD COLUMN IF NOT EXISTS edit_token VARCHAR(100) UNIQUE NULL`;
    console.log("✅ Columna edit_token agregada (o ya existía)");
  } catch (e) {
    console.log("⚠️  edit_token:", e.message);
  }

  try {
    await prisma.$executeRaw`ALTER TABLE eventos ADD COLUMN IF NOT EXISTS edit_token_expires_at DATETIME NULL`;
    console.log("✅ Columna edit_token_expires_at agregada (o ya existía)");
  } catch (e) {
    console.log("⚠️  edit_token_expires_at:", e.message);
  }

  console.log("✅ Migración completada");
}

main().finally(() => prisma.$disconnect());
