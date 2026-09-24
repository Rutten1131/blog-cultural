/**
 * Bootstrap de esquema — WhatsApp Worker
 *
 * Crea las tablas que el worker necesita, si no existen.
 * Es idempotente (CREATE TABLE IF NOT EXISTS), por lo que se puede
 * ejecutar múltiples veces sin efectos secundarios.
 *
 * Uso (dentro del contenedor):
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/ensure-schema.js
 */

require("dotenv").config({ path: "./.env" });
const mariadb = require("mariadb");

const CREATE_POSTS_SOCIAL = `
CREATE TABLE IF NOT EXISTS \`posts_social\` (
  \`id\`                   INT NOT NULL AUTO_INCREMENT,
  \`origen\`               VARCHAR(50) NOT NULL,
  \`urlOriginal\`          VARCHAR(500) NULL,
  \`textoOriginal\`        TEXT NULL,
  \`titulo\`               VARCHAR(255) NULL,
  \`descripcion\`          TEXT NULL,
  \`imagenUrl\`            VARCHAR(500) NULL,
  \`fechaPublicacion\`     DATETIME(3) NULL,
  \`lugar\`                VARCHAR(255) NULL,
  \`estado\`               ENUM('PENDIENTE','APROBADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  \`grupoId\`              VARCHAR(100) NULL,
  \`moderadoPor\`          VARCHAR(100) NULL,
  \`moderadoAt\`           DATETIME(3) NULL,
  \`moderationComentario\` TEXT NULL,
  \`confianzaIA\`          DOUBLE NULL,
  \`fechaDeteccion\`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`createdAt\`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  INDEX \`posts_social_estado_idx\` (\`estado\`),
  INDEX \`posts_social_fechaDeteccion_idx\` (\`fechaDeteccion\`),
  INDEX \`posts_social_origen_idx\` (\`origen\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`;
// Registra qué mensajes de WhatsApp ya se procesaron, para no volver a
// visitar los mismos enlaces en cada pasada del escáner (idempotencia).
const CREATE_MENSAJES_PROCESADOS = `
CREATE TABLE IF NOT EXISTS \`wa_mensajes_procesados\` (
  \`id\`                 VARCHAR(128) NOT NULL,
  \`grupoId\`            VARCHAR(100) NOT NULL,
  \`messageTimestamp\`   BIGINT NULL,
  \`urlsEncontradas\`    INT NOT NULL DEFAULT 0,
  \`postsCreados\`       INT NOT NULL DEFAULT 0,
  \`procesadoAt\`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  INDEX \`wa_msg_grupo_idx\` (\`grupoId\`),
  INDEX \`wa_msg_procesado_idx\` (\`procesadoAt\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`;
function connectionOptions() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const url = new URL(databaseUrl);

  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    connectTimeout: 20000,
    // StackCP rechaza conexiones sin SSL en algunos planes.
    ssl: false,
  };
}

async function main() {
  const options = connectionOptions();
  console.log(`[Schema] Conectando a ${options.host}:${options.port}/${options.database}`);

  const conn = await mariadb.createConnection(options);

  await conn.query(CREATE_POSTS_SOCIAL);
  console.log("[Schema] posts_social → OK");

  await conn.query(CREATE_MENSAJES_PROCESADOS);
  console.log("[Schema] wa_mensajes_procesados → OK");

  const rows = await conn.query("SHOW TABLES LIKE 'posts_social'");
  if (rows.length === 0) {
    throw new Error("La tabla posts_social no se pudo crear");
  }

  const total = await conn.query("SELECT COUNT(*) AS total FROM `posts_social`");
  console.log(`[Schema] posts_social tiene ${total[0].total} filas`);

  const procesados = await conn.query(
    "SELECT COUNT(*) AS total FROM `wa_mensajes_procesados`"
  );
  console.log(`[Schema] wa_mensajes_procesados tiene ${procesados[0].total} filas`);

  await conn.end();
  console.log("[Schema] Listo.");
}

main().catch((err) => {
  console.error("[Schema] Error:", err.message);
  process.exit(1);
});
