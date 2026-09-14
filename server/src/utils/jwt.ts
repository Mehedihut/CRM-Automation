import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "./ApiError";

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: "ADMIN" | "AGENT";
}

const SECRET = process.env.JWT_SECRET || "dev-insecure-jwt-secret-change-me";
const EXPIRES_IN = "24h";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (typeof decoded === "string") {
      throw ApiError.unauthorized("Invalid token payload");
    }
    const payload = decoded as Partial<JwtPayload>;
    if (!payload.sub || !payload.email || !payload.role) {
      throw ApiError.unauthorized("Invalid token payload");
    }
    return { sub: payload.sub, email: payload.email, role: payload.role };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized("Invalid or expired token");
  }
}

export const AUTH_COOKIE_NAME = "auth_token";

// We export env-derived helpers as well so tests / future code can reuse.
export const jwtConfig = {
  cookieName: AUTH_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: env.isProduction,
    maxAge: 24 * 60 * 60 * 1000, // 24h
    path: "/",
  },
};
