const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
require("dotenv").config({ path: "./.env" });

const url = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\//, "")),
});
const prisma = new PrismaClient({ adapter });

(async () => {
  // Evento 97 es el que tiene el título desordenado / larguísimo de Instagram:
  // "Loja es Arte y Cultura (Dir. de Cultura del Municipio de Loja) on Instagram: ..."
  // Mientras que 95 es el limpio: "Boleros Pasillos y Algo Más" (slug: "boleros-pasillos-y-algo-mas-2026-09-25-teatro-bolivar")
  
  // Vamos a eliminar el 97 de Evento
  console.log("Eliminando Evento duplicado ID 97...");
  const deleted = await prisma.evento.delete({
    where: { id: 97 }
  });
  console.log("Evento 97 eliminado con éxito:", deleted.id, deleted.slug);

  // También verificamos si el evento 95 tiene categoría asignada
  const ev95 = await prisma.evento.findUnique({
    where: { id: 95 }
  });
  console.log("Estado actual de Evento 95:", ev95);

  // Si no tiene categoría o si tiene nombreGestor como Bot WhatsApp, podemos ajustarlo a Música y Municipio de Loja
  const updateData = {};
  if (!ev95.categoriaId) {
    const catMusica = await prisma.categoria.findUnique({ where: { slug: "musica" } });
    if (catMusica) updateData.categoriaId = catMusica.id;
  }
  if (ev95.nombreGestor.includes("Bot WhatsApp")) {
    updateData.nombreGestor = "Municipio de Loja";
  }

  if (Object.keys(updateData).length > 0) {
    const updated95 = await prisma.evento.update({
      where: { id: 95 },
      data: updateData
    });
    console.log("Evento 95 actualizado:", updated95.nombre, "categoriaId:", updated95.categoriaId, "gestor:", updated95.nombreGestor);
  }

  await prisma.$disconnect();
})();
