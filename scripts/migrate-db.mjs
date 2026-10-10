/**
 * migrate-db.mjs
 * Lee TODA la data de la DB vieja y la inserta en la DB nueva.
 * Uso: node scripts/migrate-db.mjs
 */

import { PrismaClient } from '@prisma/client';

const OLD_URL = "mysql://lojaculturalsof-35303633cff2:agu2F%7CJVg%5D%C2%A3~@mysql.us.stackcp.com:44635/lojaculturalsof-35303633cff2";
const NEW_URL = "mysql://agendaculturalbd-313930d0fa:a%2BTi5%404cCgY%3A@mysql.us.stackcp.com:44369/agendaculturalbd-313930d0fa";

const oldDb = new PrismaClient({ datasources: { db: { url: OLD_URL } } });
const newDb = new PrismaClient({ datasources: { db: { url: NEW_URL } } });

async function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function migrateTable(name, readFn, writeFn) {
  const rows = await readFn();
  log(`  → ${name}: ${rows.length} registros`);
  if (rows.length === 0) return;
  try {
    for (const row of rows) {
      await writeFn(row);
    }
    log(`  ✓ ${name}: migrado OK`);
  } catch (err) {
    log(`  ✗ ${name} ERROR: ${err.message}`);
    throw err;
  }
}

async function main() {
  log('=== INICIO MIGRACIÓN DB ===');
  log(`Origen: mysql.us.stackcp.com:44635 (lojaculturalsof)`);
  log(`Destino: mysql.us.stackcp.com:44369 (agendaculturalbd)`);
  console.log('');

  // ── 1. Sin dependencias externas ───────────────────────────────────────

  log('[ 1/16 ] zonas');
  await migrateTable('zonas',
    () => oldDb.zonas.findMany(),
    (r) => newDb.zonas.upsert({ where: { id: r.id }, update: r, create: r })
  );

  log('[ 2/16 ] categorias');
  await migrateTable('categorias',
    () => oldDb.categorias.findMany(),
    (r) => newDb.categorias.upsert({ where: { id: r.id }, update: r, create: r })
  );

  log('[ 3/16 ] instituciones');
  await migrateTable('instituciones',
    () => oldDb.instituciones.findMany(),
    (r) => newDb.instituciones.upsert({ where: { id: r.id }, update: r, create: r })
  );

  log('[ 4/16 ] aliados');
  await migrateTable('aliados',
    () => oldDb.aliados.findMany(),
    (r) => newDb.aliados.upsert({ where: { id: r.id }, update: r, create: r })
  );

  log('[ 5/16 ] banners_hero');
  await migrateTable('banners_hero',
    () => oldDb.banners_hero.findMany(),
    (r) => newDb.banners_hero.upsert({ where: { id: r.id }, update: r, create: r })
  );

  log('[ 6/16 ] atractivos_cantonales');
  await migrateTable('atractivos_cantonales',
    () => oldDb.atractivos_cantonales.findMany(),
    (r) => newDb.atractivos_cantonales.upsert({ where: { id: r.id }, update: r, create: r })
  );

  log('[ 7/16 ] recomendaciones');
  await migrateTable('recomendaciones',
    () => oldDb.recomendaciones.findMany(),
    (r) => newDb.recomendaciones.upsert({ where: { id: r.id }, update: r, create: r })
  );

  log('[ 8/16 ] posts_social');
  await migrateTable('posts_social',
    () => oldDb.posts_social.findMany(),
    (r) => newDb.posts_social.upsert({ where: { id: r.id }, update: r, create: r })
  );

  log('[ 9/16 ] wa_mensajes_procesados');
  await migrateTable('wa_mensajes_procesados',
    () => oldDb.wa_mensajes_procesados.findMany(),
    (r) => newDb.wa_mensajes_procesados.upsert({ where: { id: r.id }, update: r, create: r })
  );

  // ── 2. FK a instituciones ──────────────────────────────────────────────

  log('[10/16 ] numeros_notificacion');
  await migrateTable('numeros_notificacion',
    () => oldDb.numeros_notificacion.findMany(),
    (r) => newDb.numeros_notificacion.upsert({ where: { id: r.id }, update: r, create: r })
  );

  // ── 3. FK a aliados ────────────────────────────────────────────────────

  log('[11/16 ] aliado_habitaciones');
  await migrateTable('aliado_habitaciones',
    () => oldDb.aliado_habitaciones.findMany(),
    (r) => newDb.aliado_habitaciones.upsert({ where: { id: r.id }, update: r, create: r })
  );

  // ── 4. FK a zonas/categorias ───────────────────────────────────────────

  log('[12/16 ] eventos');
  await migrateTable('eventos',
    () => oldDb.eventos.findMany(),
    (r) => newDb.eventos.upsert({ where: { id: r.id }, update: r, create: r })
  );

  // ── 5. FK a eventos ────────────────────────────────────────────────────

  log('[13/16 ] publicaciones_redes_sociales');
  await migrateTable('publicaciones_redes_sociales',
    () => oldDb.publicaciones_redes_sociales.findMany(),
    (r) => newDb.publicaciones_redes_sociales.upsert({ where: { id: r.id }, update: r, create: r })
  );

  // ── 6. Chat ────────────────────────────────────────────────────────────

  log('[14/16 ] chat_sessions');
  await migrateTable('chat_sessions',
    () => oldDb.chat_sessions.findMany(),
    (r) => newDb.chat_sessions.upsert({ where: { id: r.id }, update: r, create: r })
  );

  log('[15/16 ] chat_messages');
  await migrateTable('chat_messages',
    () => oldDb.chat_messages.findMany(),
    (r) => newDb.chat_messages.upsert({ where: { id: r.id }, update: r, create: r })
  );

  // ── 7. FK a aliados + chat_sessions ───────────────────────────────────

  log('[16/16 ] solicitudes_reserva');
  await migrateTable('solicitudes_reserva',
    () => oldDb.solicitudes_reserva.findMany(),
    (r) => newDb.solicitudes_reserva.upsert({ where: { id: r.id }, update: r, create: r })
  );

  console.log('');
  log('=== MIGRACIÓN COMPLETADA ===');
}

main()
  .catch((e) => {
    console.error('\n❌ ERROR FATAL:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  });
