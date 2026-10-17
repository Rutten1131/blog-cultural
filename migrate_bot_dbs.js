/**
 * MIGRACIÓN BOT: BotEmpresas → DB Turística + DB Gastronomía
 *
 * DB Turística  (port 46132): HOSPEDAJE, aliado_habitaciones, atractivos_cantonales
 * DB Gastronomía (port 46630): GASTRONOMIA, CAFETERIA
 *
 * Cada DB recibe: aliados, aliado_habitaciones (si aplica), atractivos_cantonales (solo Turística)
 * + tablas de CRM: chat_sessions y chat_messages (vacías pero con estructura)
 */

const mysql = require('mysql2/promise');

const SRC = {
  host: 'mysql.us.stackcp.com',
  port: 44521,
  user: 'Botempresas-353039368f96',
  password: 'nb3%.yCmga2|',
  database: 'Botempresas-353039368f96'
};

const DST_TURISTICA = {
  host: 'mysql.us.stackcp.com',
  port: 46132,
  user: 'agendatursticdinamic-31383916da',
  password: '-fr?#I}oZVxb',
  database: 'agendatursticdinamic-31383916da',
  charset: 'utf8mb4'
};

const DST_GASTRO = {
  host: 'mysql.us.stackcp.com',
  port: 46630,
  user: 'quecomerlojadinamic-313931562a',
  password: '{bS_c5HrdlrW',
  database: 'quecomerlojadinamic-313931562a',
  charset: 'utf8mb4'
};

const DDL_ALIADOS = `
CREATE TABLE IF NOT EXISTS aliados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  tipo ENUM('HOSPEDAJE','GASTRONOMIA','CAFETERIA','EXPERIENCIA','TRANSPORTE','CANTON_GAD','CULTURA_ARTE','COMERCIO','OTRO') NOT NULL,
  imagenUrl VARCHAR(500) NULL,
  servicios TEXT NULL,
  telefono VARCHAR(50) NULL,
  destacado TINYINT(1) NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME(3) NOT NULL DEFAULT NOW(3),
  cuartos TEXT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  mapaUrl VARCHAR(500) NULL,
  rangoPrecio VARCHAR(100) NULL,
  redesUrl VARCHAR(255) NULL,
  ubicacion VARCHAR(255) NOT NULL DEFAULT '',
  websiteUrl VARCHAR(255) NULL,
  ubicacionLat DOUBLE NULL,
  ubicacionLng DOUBLE NULL,
  estrellas INT NULL,
  numeroCuartos INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const DDL_HABITACIONES = `
CREATE TABLE IF NOT EXISTS aliado_habitaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aliadoId INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  precio VARCHAR(100) NULL,
  caracteristicas TEXT NULL,
  imagenes TEXT NULL,
  orden INT NOT NULL DEFAULT 0,
  createdAt DATETIME(3) NOT NULL DEFAULT NOW(3),
  INDEX idx_aliado (aliadoId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const DDL_ATRACTIVOS = `
CREATE TABLE IF NOT EXISTS atractivos_cantonales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  canton VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  distancia VARCHAR(100) NULL,
  ruta VARCHAR(255) NULL,
  imagenUrl VARCHAR(500) NULL,
  mapaUrl VARCHAR(500) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME(3) NOT NULL DEFAULT NOW(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const DDL_SESSIONS = `
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessionId VARCHAR(255) NOT NULL UNIQUE,
  siteId VARCHAR(100) NOT NULL DEFAULT '',
  ip VARCHAR(100) NULL,
  resumen TEXT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT NOW(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT NOW(3),
  INDEX idx_session (sessionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const DDL_MESSAGES = `
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessionId VARCHAR(255) NOT NULL,
  role ENUM('user','assistant') NOT NULL,
  contenido TEXT NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT NOW(3),
  INDEX idx_session (sessionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function createTables(conn, withAtractivos) {
  await conn.query(DDL_ALIADOS);
  await conn.query(DDL_HABITACIONES);
  if (withAtractivos) await conn.query(DDL_ATRACTIVOS);
  await conn.query(DDL_SESSIONS);
  await conn.query(DDL_MESSAGES);
  console.log('  Tables created OK' + (withAtractivos ? ' (with atractivos)' : ''));
}

async function migrate() {
  console.log('\n=== INICIANDO MIGRACIÓN ===\n');
  
  const src = await mysql.createConnection(SRC);
  const turistica = await mysql.createConnection(DST_TURISTICA);
  const gastro = await mysql.createConnection(DST_GASTRO);

  // ── 1. CREAR ESTRUCTURA ─────────────────────────────────────────────────────
  console.log('[1/5] Creando estructura en DB Turística...');
  await createTables(turistica, true);

  console.log('[2/5] Creando estructura en DB Gastronomía...');
  await createTables(gastro, false);

  // ── 2. LEER DATOS FUENTE ────────────────────────────────────────────────────
  console.log('[3/5] Leyendo datos de BotEmpresas...');
  const [aliados] = await src.query('SELECT * FROM aliados ORDER BY id');
  const [habitaciones] = await src.query('SELECT * FROM aliado_habitaciones ORDER BY aliadoId, orden');
  const [atractivos] = await src.query('SELECT * FROM atractivos_cantonales ORDER BY id');

  const hospedaje = aliados.filter(a => a.tipo === 'HOSPEDAJE');
  const gastroAliados = aliados.filter(a => a.tipo === 'GASTRONOMIA' || a.tipo === 'CAFETERIA');

  console.log(`  Hospedaje: ${hospedaje.length} aliados`);
  console.log(`  Gastronomía+Cafetería: ${gastroAliados.length} aliados`);
  console.log(`  Habitaciones: ${habitaciones.length}`);
  console.log(`  Atractivos: ${atractivos.length}`);

  // ── 3. MIGRAR A TURÍSTICA ───────────────────────────────────────────────────
  console.log('\n[4/5] Migrando a DB Turística...');
  
  // Mapa de IDs viejos → nuevos para habitaciones
  const idMapTuristica = {};

  for (const a of hospedaje) {
    const [res] = await turistica.query(
      `INSERT INTO aliados (nombre, tipo, imagenUrl, servicios, telefono, destacado, activo, createdAt,
        cuartos, descripcion, mapaUrl, rangoPrecio, redesUrl, ubicacion, websiteUrl, ubicacionLat, ubicacionLng, estrellas, numeroCuartos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.nombre, a.tipo, a.imagenUrl, a.servicios, a.telefono, a.destacado, a.activo, a.createdAt,
       a.cuartos, a.descripcion || '', a.mapaUrl, a.rangoPrecio, a.redesUrl, a.ubicacion || '', a.websiteUrl,
       a.ubicacionLat, a.ubicacionLng, a.estrellas, a.numeroCuartos]
    );
    idMapTuristica[a.id] = res.insertId;
    console.log(`  [OK] ${a.tipo} "${a.nombre}" id ${a.id} → nuevo id ${res.insertId}`);
  }

  // Habitaciones de los hoteles migrados
  let habsMigradas = 0;
  for (const h of habitaciones) {
    const nuevoAliadoId = idMapTuristica[h.aliadoId];
    if (!nuevoAliadoId) continue; // No es de hospedaje
    await turistica.query(
      `INSERT INTO aliado_habitaciones (aliadoId, nombre, precio, caracteristicas, imagenes, orden, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nuevoAliadoId, h.nombre, h.precio, h.caracteristicas, h.imagenes, h.orden, h.createdAt]
    );
    habsMigradas++;
    console.log(`    [OK] Hab "${h.nombre}" → aliadoId ${nuevoAliadoId}`);
  }

  // Atractivos cantonales
  let atrMigrados = 0;
  for (const at of atractivos) {
    await turistica.query(
      `INSERT INTO atractivos_cantonales (nombre, canton, descripcion, distancia, ruta, imagenUrl, mapaUrl, activo, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [at.nombre, at.canton, at.descripcion, at.distancia, at.ruta, at.imagenUrl, at.mapaUrl, at.activo, at.createdAt]
    );
    atrMigrados++;
    console.log(`    [OK] Atractivo "${at.nombre}" (${at.canton})`);
  }

  console.log(`  => ${hospedaje.length} aliados + ${habsMigradas} habitaciones + ${atrMigrados} atractivos migrados a Turística`);

  // ── 4. MIGRAR A GASTRONOMÍA ─────────────────────────────────────────────────
  console.log('\n[5/5] Migrando a DB Gastronomía...');

  for (const a of gastroAliados) {
    const [res] = await gastro.query(
      `INSERT INTO aliados (nombre, tipo, imagenUrl, servicios, telefono, destacado, activo, createdAt,
        cuartos, descripcion, mapaUrl, rangoPrecio, redesUrl, ubicacion, websiteUrl, ubicacionLat, ubicacionLng, estrellas, numeroCuartos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.nombre, a.tipo, a.imagenUrl, a.servicios, a.telefono, a.destacado, a.activo, a.createdAt,
       a.cuartos, a.descripcion || '', a.mapaUrl, a.rangoPrecio, a.redesUrl, a.ubicacion || '', a.websiteUrl,
       a.ubicacionLat, a.ubicacionLng, a.estrellas, a.numeroCuartos]
    );
    console.log(`  [OK] ${a.tipo} "${a.nombre}" id ${a.id} → nuevo id ${res.insertId}`);
  }

  console.log(`  => ${gastroAliados.length} aliados gastronómicos migrados a Gastronomía`);

  // ── 5. VERIFICACIÓN FINAL ───────────────────────────────────────────────────
  console.log('\n=== VERIFICACIÓN FINAL ===');

  const [[{ n: nT }]] = await turistica.query('SELECT COUNT(*) as n FROM aliados');
  const [[{ nh }]] = await turistica.query('SELECT COUNT(*) as nh FROM aliado_habitaciones');
  const [[{ na }]] = await turistica.query('SELECT COUNT(*) as na FROM atractivos_cantonales');
  const [[{ nG }]] = await gastro.query('SELECT COUNT(*) as n FROM aliados');

  console.log(`DB Turística   → aliados: ${nT}, habitaciones: ${nh}, atractivos: ${na}`);
  console.log(`DB Gastronomía → aliados: ${nG}`);
  console.log('\n✅ MIGRACIÓN COMPLETA');

  await src.end();
  await turistica.end();
  await gastro.end();
}

migrate().catch(err => {
  console.error('❌ ERROR:', err.message);
  process.exit(1);
});
