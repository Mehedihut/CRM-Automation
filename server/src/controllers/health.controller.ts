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
