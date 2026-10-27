import { createRequire } from "node:module";
import pino, { type LoggerOptions } from "pino";
import { env, isProduction, isTest } from "./env.js";

const require = createRequire(import.meta.url);

/**
 * pino-pretty é uma devDependency: na imagem de produção não existe.
 * Confirmamos que está instalado antes de o referenciar, para que um NODE_ENV
 * mal configurado não derrube a API no arranque.
 */
function prettyTransport(): LoggerOptions["transport"] | undefined {
  try {
    require.resolve("pino-pretty");
  } catch {
    return undefined;
  }

  return {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    },
  };
}

const transport = isProduction ? undefined : prettyTransport();

/**
 * Logger estruturado. Em produção escreve JSON (pronto para ingestão);
 * em desenvolvimento usa pino-pretty se estiver disponível.
 * Cabeçalhos sensíveis nunca são escritos.
 */
export const logger = pino({
  level: isTest ? "silent" : env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
    ],
    censor: "[REDACTED]",
  },
  ...(transport ? { transport } : {}),
});
