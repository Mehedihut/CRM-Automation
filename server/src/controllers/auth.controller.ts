import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";
import { getPrismaClient } from "../config/prisma";
import { getCurrentUser, login } from "../services/auth.service";
import { COOKIE_NAME } from "../middleware/requireAuth";
import type { LoginInput } from "../validators/auth.schema";

// Cookie maxAge is in milliseconds. `jsonwebtoken` returns expiresIn in
// seconds or a string like "7d". We default to 7d when the env var is a
// string we can't easily parse — good enough for an MVP.
const DEFAULT_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProduction,
    domain: env.cookieDomain || undefined,
    path: "/",
    maxAge: DEFAULT_COOKIE_MAX_AGE_MS,
  };
}

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;
  const { user, token } = await login(getPrismaClient(), email, password);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.status(200).json({ success: true, data: { user } });
});

export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
  res.status(204).end();
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  // requireAuth already attached req.user.
  const user = await getCurrentUser(getPrismaClient(), req.user!.id);
  res.status(200).json({ success: true, data: { user } });
});
