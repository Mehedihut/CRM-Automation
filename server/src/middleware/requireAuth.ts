import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyToken } from "../utils/jwt";

export const COOKIE_NAME = "crm_token";

/**
 * Reads the JWT cookie, verifies it, and sets req.user.
 * Throws ApiError.unauthorized on any failure. Use after cookie-parser
 * (already wired in app.ts).
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    throw ApiError.unauthorized("Not authenticated");
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired session");
  }
}
