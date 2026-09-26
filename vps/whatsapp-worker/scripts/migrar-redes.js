const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
require('dotenv').config({ path: './.env' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL no configurada");
  process.exit(1);
}

const url = new URL(databaseUrl);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\//, ''))
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Creando tabla publicaciones_redes_sociales...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS publicaciones_redes_sociales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      evento_id INT NOT NULL UNIQUE,
      plataformas VARCHAR(200) NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      programado_at DATETIME NOT NULL,
      publicado_at DATETIME NULL,
      estado ENUM('PENDIENTE', 'PROGRAMADO', 'PUBLICADO', 'FALLIDO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
      respuestaApi JSON NULL,
      error TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_prs_programado (programado_at),
      INDEX idx_prs_estado (estado),
      CONSTRAINT fk_prs_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✅ TABLA_CREADA_EXITOSAMENTE");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ ERROR AL CREAR TABLA:", err);
  process.exit(1);
});
