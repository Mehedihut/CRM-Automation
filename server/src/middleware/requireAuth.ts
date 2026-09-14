import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { AUTH_COOKIE_NAME, verifyToken, type JwtPayload } from "../utils/jwt";

// Augment Express Request with our `user` field.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies the request is authenticated.
 * Accepts the JWT from either:
 *   - the httpOnly cookie `auth_token`
 *   - `Authorization: Bearer <token>`
 * On success, sets `req.user = { sub, email, role }`.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
    const header = req.headers.authorization;
    const bearerToken =
      header && header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : undefined;

    const token = cookieToken || bearerToken;
    if (!token) {
      throw ApiError.unauthorized("Authentication required");
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}
