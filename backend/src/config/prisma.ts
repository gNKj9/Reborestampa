import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env, isProduction } from "./env.js";
import { logger } from "./logger.js";

/**
 * Cliente Prisma com driver adapter oficial (pg).
 * - Todas as queries passam por prepared statements gerados pelo Prisma;
 *   não existe SQL concatenado em lado nenhum da aplicação.
 * - Pool limitado para não esgotar ligações do PostgreSQL.
 */
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
});

export const prisma = new PrismaClient({
  adapter,
  log: isProduction
    ? [{ emit: "event", level: "error" }]
    : [
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" },
      ],
});

prisma.$on("error", (event) => {
  logger.error({ target: event.target }, "Erro do Prisma Client");
});

prisma.$on("warn", (event) => {
  logger.warn({ target: event.target }, "Aviso do Prisma Client");
});

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
