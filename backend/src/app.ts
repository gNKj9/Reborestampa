import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { apiRouter } from "./api/index.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { globalRateLimiter } from "./middlewares/rateLimit.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { requestId } from "./middlewares/requestId.js";

/**
 * A API só devolve JSON, por isso pode ter o CSP mais restritivo possível.
 */
const apiHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy: { policy: "no-referrer" },
  hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: false },
});

/**
 * Headers para o site servido pelo Express (output estático do Next).
 * `unsafe-inline` em scripts é inevitável com export estático: o Next injeta
 * o payload de hidratação inline e não há nonce possível em ficheiros estáticos.
 */
const webHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: false },
});

/**
 * Composição da aplicação HTTP.
 * A ordem dos middlewares é parte da política de segurança:
 * request-id -> log -> headers -> CORS -> body -> cookies -> rate limit -> rotas.
 */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  // Atrás de proxy reverso (Render, nginx, traefik): confia num único salto
  // para obter o IP real sem permitir spoofing arbitrário de X-Forwarded-For.
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(requestId);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as express.Request).requestId,
      autoLogging: {
        ignore: (req) => req.url?.startsWith("/api/health") ?? false,
      },
      customLogLevel: (_req, res, error) => {
        if (error || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      serializers: {
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  // Um conjunto de headers por tipo de resposta: JSON na API, HTML no site.
  app.use((req, res, next) =>
    req.path.startsWith("/api") ? apiHeaders(req, res, next) : webHeaders(req, res, next),
  );

  app.use(
    cors((req, callback) => {
      const origin = req.header("Origin");
      const selfOrigin = `${req.protocol}://${req.get("host")}`;

      // Mesma origem (site + API no mesmo host) é sempre permitida; a
      // allowlist serve para clientes externos legítimos.
      const allowed =
        !origin || env.CORS_ORIGINS.includes(origin) || origin === selfOrigin;

      if (!allowed) {
        logger.warn({ origin }, "Origem bloqueada pelo CORS");
      }

      callback(null, {
        origin: allowed,
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
        exposedHeaders: [
          "X-Request-Id",
          "RateLimit",
          "RateLimit-Policy",
          "Retry-After",
        ],
        maxAge: 600,
      });
    }),
  );

  // Limite de payload: nenhuma rota desta API precisa de mais do que isto.
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use("/api/auth", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.use("/api", globalRateLimiter);
  app.use("/api", apiRouter);
  // Qualquer rota /api desconhecida responde em JSON, nunca com HTML.
  app.use("/api", notFoundHandler);

  if (env.SERVE_STATIC) {
    const staticDir = path.resolve(env.STATIC_DIR);

    // Páginas: / -> index.html, /login -> login.html.
    // Não usamos o fallback de extensões do express.static porque o Next cria
    // pastas com o mesmo nome (login/, painel/) para o payload RSC e o static
    // responderia 301 para a pasta em vez do HTML.
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (path.extname(req.path) || req.path.startsWith("/_next/")) return next();

      const clean = req.path.replace(/\/+$/, "");
      const relative = clean === "" ? "index.html" : `${clean.slice(1)}.html`;
      const file = path.resolve(staticDir, relative);

      // Barreira contra path traversal (/, /../etc/passwd, etc.).
      if (!file.startsWith(staticDir + path.sep)) return next();

      res.sendFile(
        file,
        { headers: { "Cache-Control": "no-cache" } },
        (error) => {
          if (error) next();
        },
      );
    });

    app.use(
      express.static(staticDir, {
        index: false,
        maxAge: "1h",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      }),
    );

    // Fallback: rotas do Next sem ficheiro correspondente recebem o 404.html.
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (!req.accepts("html")) return next();

      res.status(404).sendFile(path.join(staticDir, "404.html"), (error) => {
        if (error) next();
      });
    });

    logger.info({ staticDir }, "A servir o frontend estático");
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
