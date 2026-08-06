import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Cargar .env.local explícitamente (Next.js lo carga en runtime,
// pero Prisma CLI necesita que se lo indiquemos manualmente).
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
