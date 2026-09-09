import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getHealthStatus } from "../services/health.service";
import { getPrismaClient } from "../config/prisma";
import { logger } from "../utils/logger";

/**
 * GET /api/health
 * Public endpoint for liveness + DB readiness probe.
 * Returns 200 even when DB is unreachable so monitoring can detect the state,
 * and includes a clear message in the body instead of crashing.
 */
export const health = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  let dbError: string | undefined;

  // Only attempt a DB check when the URL is configured. Without a URL we
  // report "configured: false" rather than throwing.
  if (process.env.DATABASE_URL) {
    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbError = err instanceof Error ? err.message : "Unknown database error";
      logger.warn("Health check: database unreachable", { dbError });
    }
  }

  const status = getHealthStatus(dbError);
  res.status(200).json({ success: true, data: status });
});

/**
 * GET /api/healthz
 * Stricter 12-factor liveness/readiness probe. Returns 503 when the
 * database is configured but unreachable — Vercel + uptime monitors will
 * mark the deploy unhealthy and stop sending traffic.
 */
export const healthz = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const dbConfigured = Boolean(process.env.DATABASE_URL);

  if (!dbConfigured) {
    // Boot is valid; nothing is wired yet. 200 keeps monitoring green until
    // DATABASE_URL is supplied.
    res.status(200).json({
      success: true,
      data: { status: "ok", db: "not_configured" },
    });
    return;
  }

  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, data: { status: "ok", db: "ok" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    logger.warn("Healthz: database unreachable", { err: message });
    res.status(503).json({
      success: false,
      error: { code: "DATABASE_UNAVAILABLE", message: "Database is unreachable." },
      data: { status: "unhealthy", db: "error", detail: message },
    });
  }
});
