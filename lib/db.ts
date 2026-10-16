import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool() {
  if (!pool) {
    const host = process.env.BLOG_DB_HOST || 'mysql.us.stackcp.com';
    const port = Number(process.env.BLOG_DB_PORT || 44369);
    const user = process.env.BLOG_DB_USER || 'agendaculturalbd-313930d0fa';
    const password = process.env.BLOG_DB_PASS || 'a+Ti5@4cCgY:';
    const database = process.env.BLOG_DB_NAME || 'agendaculturalbd-313930d0fa';

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 7000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }
  return pool;
}

export async function initDb() {
  try {
    const db = getDbPool();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS blog_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        titulo VARCHAR(255) NOT NULL,
        resumen TEXT NOT NULL,
        contenido LONGTEXT NOT NULL,
        imagen LONGTEXT NOT NULL,
        imagen_alt VARCHAR(255) NOT NULL DEFAULT '',
        video_url TEXT NULL,
        categoria VARCHAR(100) NOT NULL DEFAULT 'Cultura',
        etiquetas JSON NULL,
        canton_slug VARCHAR(100) NULL,
        autor VARCHAR(100) NOT NULL DEFAULT 'Agenda Cultural Loja',
        fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
        publicado TINYINT(1) NOT NULL DEFAULT 1,
        tiempo_lectura INT NOT NULL DEFAULT 5,
        INDEX idx_slug (slug),
        INDEX idx_publicado (publicado),
        INDEX idx_fecha (fecha_publicacion)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await db.query(createTableQuery);
  } catch (err: any) {
    console.warn('Error inicializando tabla blog_posts:', err.message);
  }
}

export const getPool = getDbPool;
export const dbEnabled = true;
