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

  // Borramos el evento repetido #98 (que tiene la imagen con texto de prensa recortado) y conservamos el #101 (afiche limpio)
  const eliminado = await prisma.evento.delete({
    where: { id: 98 },
  });

  console.log(`✅ Evento duplicado #${eliminado.id} ("${eliminado.nombre}") eliminado correctamente.`);

  await prisma.$disconnect();
}

main().catch(console.error);
