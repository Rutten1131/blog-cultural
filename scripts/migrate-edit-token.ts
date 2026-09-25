import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const DATABASE_URL = "mysql://lojaculturalsof-35303633cff2:agu2F%7CJVg%5D%C2%A3~@mysql.us.stackcp.com:44635/lojaculturalsof-35303633cff2";

async function main() {
  const url = new URL(DATABASE_URL);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", ""),
  });

  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE eventos ADD COLUMN edit_token VARCHAR(100) UNIQUE NULL;"
    );
    console.log("✅ Columna edit_token agregada con éxito");
  } catch (e: any) {
    if (e.message?.includes("Duplicate column") || e.code === "ER_DUP_FIELDNAME") {
      console.log("ℹ️ Columna edit_token ya existía");
    } else {
      console.log("⚠️ edit_token:", e.message);
    }
  }

  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE eventos ADD COLUMN edit_token_expires_at DATETIME NULL;"
    );
    console.log("✅ Columna edit_token_expires_at agregada con éxito");
  } catch (e: any) {
    if (e.message?.includes("Duplicate column") || e.code === "ER_DUP_FIELDNAME") {
      console.log("ℹ️ Columna edit_token_expires_at ya existía");
    } else {
      console.log("⚠️ edit_token_expires_at:", e.message);
    }
  }

  console.log("🎉 Migración de columnas finalizada.");
  await prisma.$disconnect();
}

main().catch(console.error);
