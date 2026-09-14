import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export type Role = "ADMIN" | "AGENT";

/**
 * Factory: returns a middleware that ensures `req.user.role` is in the allow-list.
 * Must run AFTER requireAuth.
 *
 * Usage:
 *   router.post("/x", requireAuth, requireRole("ADMIN"), handler)
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized("Authentication required"));
      return;
    }
    if (!allowed.includes(req.user.role)) {
      next(ApiError.forbidden(`Requires role: ${allowed.join(" or ")}`));
      return;
    }
    next();
  };
}
