import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const healthRouter = Router();

/** Liveness: processo vivo, sem tocar na base de dados. */
healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "reborestampa-api",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/** Readiness: confirma a ligação ao PostgreSQL antes de receber tráfego. */
healthRouter.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready", database: "up" });
  } catch (error) {
    logger.error({ err: error }, "Readiness falhou: base de dados inacessível");
    res.status(503).json({ status: "unavailable", database: "down" });
  }
});
