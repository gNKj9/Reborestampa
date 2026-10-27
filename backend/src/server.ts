import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { disconnectPrisma } from "./config/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, cors: env.CORS_ORIGINS },
    "API Reborestampa a escutar",
  );
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, "A encerrar a aplicação");

  // Prazo máximo para conexões em curso terminarem.
  const forceExit = setTimeout(() => {
    logger.error("Encerramento forçado após timeout");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async () => {
    try {
      await disconnectPrisma();
      logger.info("Encerrado de forma limpa");
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Erro ao encerrar a ligação à base de dados");
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Promise rejeitada sem tratamento");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Exceção não capturada — a encerrar");
  process.exit(1);
});
