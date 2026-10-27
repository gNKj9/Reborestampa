import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Configuração do Prisma CLI (Prisma 7).
 * O URL da base de dados deixou de viver no schema.prisma: é aqui que a CLI
 * o resolve, a partir de variáveis de ambiente. Nada de credenciais no repo.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
