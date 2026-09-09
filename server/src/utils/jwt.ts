import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { logger } from "./logger";

export interface JwtPayload {
  sub: number; // user id
  email: string;
  role: "ADMIN" | "AGENT";
}

const SECRET: string = env.jwtSecret ?? "dev-insecure-jwt-secret-change-me";
if (env.isProduction && SECRET === "dev-insecure-jwt-secret-change-me") {
  logger.warn(
    "JWT_SECRET is using the insecure development fallback in production. Set JWT_SECRET in server/.env.",
  );
}

export function signToken(payload: JwtPayload): string {
  // jsonwebtoken's expiresIn accepts either a number (seconds) or a string
  // like "7d". We pass the env var straight through.
  return jwt.sign(payload, SECRET, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, SECRET);
  if (typeof decoded === "string") {
    throw new Error("Unexpected JWT payload shape");
  }
  const { sub, email, role } = decoded as Partial<JwtPayload>;
  if (typeof sub !== "number" || typeof email !== "string" || (role !== "ADMIN" && role !== "AGENT")) {
    throw new Error("Invalid JWT payload");
  }
  return { sub, email, role };
}
