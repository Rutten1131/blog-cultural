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
  const result = await prisma.postSocial.deleteMany({
    where: { estado: "PENDIENTE" },
  });
  console.log(`Se eliminaron ${result.count} posts en estado PENDIENTE.`);
  await prisma.$disconnect();
})();
