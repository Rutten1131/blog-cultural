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
  const ev = await prisma.evento.findFirst({
    where: { slug: { contains: "entre-lo-concreto" } },
  });
  console.log("EVENTO:", JSON.stringify(ev, null, 2));

  const post = await prisma.postSocial.findFirst({
    where: {
      OR: [
        { titulo: { contains: "concreto" } },
        { urlOriginal: { contains: "DdtwTZ_KyHK" } },
      ],
    },
  });
  console.log("POST SOCIAL:", JSON.stringify(post, null, 2));

  await prisma.$disconnect();
})();
