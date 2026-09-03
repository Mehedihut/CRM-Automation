import type { NextFunction, Request, Response } from "express";

/**
 * Wraps an async route handler so thrown errors are forwarded to the
 * Express error-handling middleware instead of becoming unhandled rejections.
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
