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

  const eventos = await prisma.evento.findMany({
    where: { nombre: { contains: "Godi" } },
    select: {
      id: true,
      nombre: true,
      slug: true,
      fecha: true,
      lugar: true,
      nombreGestor: true,
      imagenUrl: true,
      estado: true,
      createdAt: true,
    },
  });

  console.log("EVENTOS ENCONTRADOS:");
  console.log(JSON.stringify(eventos, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
