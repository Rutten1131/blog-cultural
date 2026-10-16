const mysql = require('mysql2/promise');

async function sync() {
  const dbBotUrl = 'mysql://Botempresas-353039368f96:nb3%25.yCmga2%7C@mysql.us.stackcp.com:44521/Botempresas-353039368f96';
  const dbAgendaUrl = 'mysql://agendaculturalbd-313930d0fa:a%2BTi5%404cCgY%3A@mysql.us.stackcp.com:44369/agendaculturalbd-313930d0fa';

  console.log('Conectando a bases de datos...');
  const connBot = await mysql.createConnection(dbBotUrl);
  const connAgenda = await mysql.createConnection(dbAgendaUrl);

  console.log('Creando tabla aliados en Botempresas si no existe...');
  await connBot.execute(`
    CREATE TABLE IF NOT EXISTS \`aliados\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`nombre\` varchar(150) NOT NULL,
      \`tipo\` enum('HOSPEDAJE','GASTRONOMIA','CAFETERIA','EXPERIENCIA','TRANSPORTE','CANTON_GAD','CULTURA_ARTE','COMERCIO','OTRO') NOT NULL DEFAULT 'HOSPEDAJE',
      \`imagenUrl\` varchar(500) DEFAULT NULL,
      \`servicios\` text DEFAULT NULL,
      \`telefono\` varchar(50) DEFAULT NULL,
      \`destacado\` tinyint(1) NOT NULL DEFAULT 1,
      \`activo\` tinyint(1) NOT NULL DEFAULT 1,
      \`createdAt\` datetime(3) NOT NULL DEFAULT current_timestamp(3),
      \`cuartos\` text DEFAULT NULL,
      \`descripcion\` text NOT NULL,
      \`mapaUrl\` varchar(500) DEFAULT NULL,
      \`rangoPrecio\` varchar(100) DEFAULT NULL,
      \`redesUrl\` varchar(255) DEFAULT NULL,
      \`ubicacion\` varchar(255) NOT NULL,
      \`websiteUrl\` varchar(255) DEFAULT NULL,
      \`ubicacionLat\` double DEFAULT NULL,
      \`ubicacionLng\` double DEFAULT NULL,
      \`estrellas\` int(11) DEFAULT NULL,
      \`numeroCuartos\` int(11) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`aliados_tipo_activo_idx\` (\`tipo\`,\`activo\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Creando tabla aliado_habitaciones en Botempresas si no existe...');
  await connBot.execute(`
    CREATE TABLE IF NOT EXISTS \`aliado_habitaciones\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`aliadoId\` int(11) NOT NULL,
      \`nombre\` varchar(150) NOT NULL,
      \`precio\` varchar(100) DEFAULT NULL,
      \`caracteristicas\` text DEFAULT NULL,
      \`imagenes\` text DEFAULT NULL,
      \`orden\` int(11) NOT NULL DEFAULT 0,
      \`createdAt\` datetime(3) NOT NULL DEFAULT current_timestamp(3),
      PRIMARY KEY (\`id\`),
      KEY \`aliado_habitaciones_aliadoId_idx\` (\`aliadoId\`),
      CONSTRAINT \`aliado_habitaciones_aliadoId_fkey\` FOREIGN KEY (\`aliadoId\`) REFERENCES \`aliados\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Creando tabla atractivos_cantonales en Botempresas si no existe...');
  await connBot.execute(`
    CREATE TABLE IF NOT EXISTS \`atractivos_cantonales\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`nombre\` varchar(150) NOT NULL,
      \`canton\` varchar(100) NOT NULL,
      \`descripcion\` text NOT NULL,
      \`distancia\` varchar(100) NOT NULL,
      \`ruta\` varchar(255) NOT NULL,
      \`imagenUrl\` varchar(500) DEFAULT NULL,
      \`mapaUrl\` varchar(500) DEFAULT NULL,
      \`activo\` tinyint(1) NOT NULL DEFAULT 1,
      \`createdAt\` datetime(3) NOT NULL DEFAULT current_timestamp(3),
      PRIMARY KEY (\`id\`),
      KEY \`atractivos_cantonales_canton_activo_idx\` (\`canton\`,\`activo\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Sincronizar data inicial si están vacías
  const [aliadosBotCount] = await connBot.execute('SELECT COUNT(*) as c FROM aliados');
  if (aliadosBotCount[0].c === 0) {
    console.log('Copiando aliados desde Agenda Cultural a Botempresas...');
    const [aliados] = await connAgenda.execute('SELECT * FROM aliados');
    for (const a of aliados) {
      await connBot.execute(
        `INSERT INTO aliados (id, nombre, tipo, imagenUrl, servicios, telefono, destacado, activo, createdAt, cuartos, descripcion, mapaUrl, rangoPrecio, redesUrl, ubicacion, websiteUrl, ubicacionLat, ubicacionLng, estrellas, numeroCuartos)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.nombre, a.tipo, a.imagenUrl, a.servicios, a.telefono, a.destacado, a.activo, a.createdAt, a.cuartos, a.descripcion, a.mapaUrl, a.rangoPrecio, a.redesUrl, a.ubicacion, a.websiteUrl, a.ubicacionLat, a.ubicacionLng, a.estrellas, a.numeroCuartos]
      );
    }
    console.log(`Se insertaron ${aliados.length} aliados en Botempresas.`);
  } else {
    console.log(`Aliados ya existen en Botempresas (${aliadosBotCount[0].c} registros).`);
  }

  const [habsBotCount] = await connBot.execute('SELECT COUNT(*) as c FROM aliado_habitaciones');
  if (habsBotCount[0].c === 0) {
    console.log('Copiando aliado_habitaciones desde Agenda Cultural a Botempresas...');
    const [habs] = await connAgenda.execute('SELECT * FROM aliado_habitaciones');
    for (const h of habs) {
      await connBot.execute(
        `INSERT INTO aliado_habitaciones (id, aliadoId, nombre, precio, caracteristicas, imagenes, orden, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [h.id, h.aliadoId, h.nombre, h.precio, h.caracteristicas, h.imagenes, h.orden, h.createdAt]
      );
    }
    console.log(`Se insertaron ${habs.length} habitaciones en Botempresas.`);
  } else {
    console.log(`Habitaciones ya existen en Botempresas (${habsBotCount[0].c} registros).`);
  }

  const [atractivosBotCount] = await connBot.execute('SELECT COUNT(*) as c FROM atractivos_cantonales');
  if (atractivosBotCount[0].c === 0) {
    console.log('Copiando atractivos_cantonales desde Agenda Cultural a Botempresas...');
    const [atractivos] = await connAgenda.execute('SELECT * FROM atractivos_cantonales');
    for (const at of atractivos) {
      await connBot.execute(
        `INSERT INTO atractivos_cantonales (id, nombre, canton, descripcion, distancia, ruta, imagenUrl, mapaUrl, activo, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [at.id, at.nombre, at.canton, at.descripcion, at.distancia, at.ruta, at.imagenUrl, at.mapaUrl, at.activo, at.createdAt]
      );
    }
    console.log(`Se insertaron ${atractivos.length} atractivos en Botempresas.`);
  } else {
    console.log(`Atractivos ya existen en Botempresas (${atractivosBotCount[0].c} registros).`);
  }

  console.log('Operación completada exitosamente.');
  await connBot.end();
  await connAgenda.end();
}

sync().catch(err => {
  console.error('ERROR EN MIGRACION:', err);
  process.exit(1);
});
