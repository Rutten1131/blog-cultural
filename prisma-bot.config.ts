import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Cargar .env.local explícitamente (Prisma CLI no lo carga solo).
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  schema: "prisma/schema-bot.prisma",
  migrations: {
    path: "prisma/migrations-bot",
  },
  datasource: {
    url: env("CHATBOT_DB_URL"),
  },
});
