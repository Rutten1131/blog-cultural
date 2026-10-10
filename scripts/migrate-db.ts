/**
 * migrate-db.ts
 * Migra TODA la data de la DB vieja → DB nueva.
 *
 * Paso 1 (export):
 *   $env:DATABASE_URL="mysql://lojaculturalsof-35303633cff2:agu2F%7CJVg%5D%C2%A3~@mysql.us.stackcp.com:44635/lojaculturalsof-35303633cff2"
 *   npx tsx scripts\migrate-db.ts export
 *
 * Paso 2 (import):
 *   $env:DATABASE_URL="mysql://agendaculturalbd-313930d0fa:a%2BTi5%404cCgY%3A@mysql.us.stackcp.com:44369/agendaculturalbd-313930d0fa"
 *   npx tsx scripts\migrate-db.ts import
 */

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import fs from 'fs';
import path from 'path';

const DUMP_FILE = path.join(process.cwd(), 'scripts', 'db-dump.json');

function createClient(urlStr: string): PrismaClient {
  const url = new URL(urlStr);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace('/', ''),
  });
  return new PrismaClient({ adapter });
}

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// Nombres camelCase del Prisma Client, en orden de FK constraints
const TABLES: Array<{ key: string; upsertId: (r: any) => any }> = [
  { key: 'zona',                 upsertId: (r) => ({ id: r.id }) },
  { key: 'categoria',            upsertId: (r) => ({ id: r.id }) },
  { key: 'institucion',          upsertId: (r) => ({ id: r.id }) },
  { key: 'aliado',               upsertId: (r) => ({ id: r.id }) },
  { key: 'bannerHero',           upsertId: (r) => ({ id: r.id }) },
  { key: 'atractivoCantonal',    upsertId: (r) => ({ id: r.id }) },
  { key: 'recomendacion',        upsertId: (r) => ({ id: r.id }) },
  { key: 'postSocial',           upsertId: (r) => ({ id: r.id }) },
  { key: 'waMensajeProcesado',   upsertId: (r) => ({ id: r.id }) },
  { key: 'numeroNotificacion',   upsertId: (r) => ({ id: r.id }) },
  { key: 'aliadoHabitacion',     upsertId: (r) => ({ id: r.id }) },
  { key: 'evento',               upsertId: (r) => ({ id: r.id }) },
  { key: 'publicacionRedSocial', upsertId: (r) => ({ id: r.id }) },
  { key: 'chatSession',          upsertId: (r) => ({ id: r.id }) },
  { key: 'chatMessage',          upsertId: (r) => ({ id: r.id }) },
  { key: 'solicitudReserva',     upsertId: (r) => ({ id: r.id }) },
];

// ── EXPORT ────────────────────────────────────────────────────────────────
async function exportData() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no definida');

  const db = createClient(url);
  const parsedUrl = new URL(url);
  log('=== EXPORT: DB VIEJA → JSON ===');
  log(`Host: ${parsedUrl.host}`);
  log(`DB  : ${parsedUrl.pathname.slice(1)}`);
  console.log('');

  const dump: Record<string, any[]> = {};
  let total = 0;

  for (const { key } of TABLES) {
    try {
      const rows = await (db as any)[key].findMany();
      dump[key] = rows;
      total += rows.length;
      log(`  ✓ ${key.padEnd(25)} ${rows.length} filas`);
    } catch (e: any) {
      log(`  ✗ ${key.padEnd(25)} ERROR: ${e.message}`);
      dump[key] = [];
    }
  }

  // BigInt (ej: messageTimestamp) no es serializable por JSON.stringify por defecto
  fs.writeFileSync(DUMP_FILE, JSON.stringify(dump, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
  console.log('');
  log(`✅ Export completado: ${total} registros totales`);
  log(`   Guardado en: ${DUMP_FILE}`);

  await db.$disconnect();
}

// ── IMPORT ────────────────────────────────────────────────────────────────
async function importData() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no definida');

  if (!fs.existsSync(DUMP_FILE)) {
    throw new Error(`No encontrado: ${DUMP_FILE}\nCorre primero: npx tsx scripts\\migrate-db.ts export`);
  }

  const db = createClient(url);
  const parsedUrl = new URL(url);
  log('=== IMPORT: JSON → DB NUEVA ===');
  log(`Host: ${parsedUrl.host}`);
  log(`DB  : ${parsedUrl.pathname.slice(1)}`);
  console.log('');

  const dump = JSON.parse(fs.readFileSync(DUMP_FILE, 'utf-8')) as Record<string, any[]>;
  let totalOk = 0, totalErr = 0;

  for (const { key, upsertId } of TABLES) {
    const rows = dump[key] ?? [];
    if (rows.length === 0) {
      log(`  - ${key.padEnd(25)} (vacía)`);
      continue;
    }

    let ok = 0, err = 0;
    for (const row of rows) {
      try {
        await (db as any)[key].upsert({
          where: upsertId(row),
          update: row,
          create: row,
        });
        ok++;
      } catch (e: any) {
        err++;
        if (err <= 3) log(`    ✗ id=${row.id}: ${e.message}`);
      }
    }

    totalOk += ok;
    totalErr += err;
    const sym = err === 0 ? '✓' : '⚠';
    log(`  ${sym} ${key.padEnd(25)} ${ok}/${rows.length}${err > 0 ? ` (${err} err)` : ''}`);
  }

  console.log('');
  log(`✅ Import completado: ${totalOk} OK | ${totalErr} errores`);

  await db.$disconnect();
}

// ── Main ──────────────────────────────────────────────────────────────────
const mode = process.argv[2];

async function main() {
  if (mode === 'export') {
    await exportData();
  } else if (mode === 'import') {
    await importData();
  } else {
    console.log(`
Uso:
  # Paso 1 — Exportar DB vieja
  $env:DATABASE_URL="mysql://lojaculturalsof-35303633cff2:agu2F%7CJVg%5D%C2%A3~@mysql.us.stackcp.com:44635/lojaculturalsof-35303633cff2"
  npx tsx scripts\\migrate-db.ts export

  # Paso 2 — Importar a DB nueva  
  $env:DATABASE_URL="mysql://agendaculturalbd-313930d0fa:a%2BTi5%404cCgY%3A@mysql.us.stackcp.com:44369/agendaculturalbd-313930d0fa"
  npx tsx scripts\\migrate-db.ts import
    `);
    process.exit(1);
  }
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
