import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { logger } from "../utils/logger";

interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 404 handler — must be registered after all routes.
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Zod validation errors → 400 with field-level details.
  if (err instanceof ZodError) {
    const body: ErrorBody = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: err.flatten(),
      },
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof ApiError) {
    const body: ErrorBody = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    if (err.status >= 500) {
      logger.error(`ApiError ${err.status} ${err.code}`, { message: err.message });
    }
    res.status(err.status).json(body);
    return;
  }

  // Fallback for unknown errors — never leak internals in production.
  logger.error("Unhandled error", { err: serializeError(err) });
  const body: ErrorBody = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: env.isProduction ? "Internal server error." : readableMessage(err),
      details: env.isProduction ? undefined : serializeError(err),
    },
  };
  res.status(500).json(body);
}

function readableMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function serializeError(err: unknown): unknown {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return err;
}
