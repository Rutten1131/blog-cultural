/**
 * Prisma Client singleton para la DB del Bot (multisite).
 * Uso: import { prismaBot } from "@/lib/prisma-bot";
 *
 * Esta DB almacena: chat_sessions, chat_messages, solicitudes_reserva, bot_sites.
 * Es compartida entre todos los proyectos (Agenda Cultural, QueComerEnLoja, AgendaTuristicaLoja).
 *
 * La DB de contenido (eventos, aliados, atractivos) sigue en la DB principal (@/lib/prisma).
 */

import { PrismaClient } from "../node_modules/.prisma/bot-client/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createPrismaBotClient(): InstanceType<typeof PrismaClient> {
  const url = new URL(process.env.CHATBOT_DB_URL!);

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", ""),
  });

  return new PrismaClient({ adapter } as any);
}

const globalForPrismaBot = globalThis as unknown as {
  prismaBot: InstanceType<typeof PrismaClient> | undefined;
};

export const prismaBot = globalForPrismaBot.prismaBot ?? createPrismaBotClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrismaBot.prismaBot = prismaBot;
}
