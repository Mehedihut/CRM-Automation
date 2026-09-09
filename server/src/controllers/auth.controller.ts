import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";
import { getPrismaClient } from "../config/prisma";
import { getCurrentUser, login, recordLogout } from "../services/auth.service";
import {
  completePasswordReset,
  requestPasswordReset,
} from "../services/passwordReset.service";
import { COOKIE_NAME } from "../middleware/requireAuth";
import type { ForgotInput, LoginInput, ResetInput } from "../validators/auth.schema";

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

function requestContext(req: Request): { ip: string | null; userAgent: string | null } {
  return {
    ip: req.ip ?? null,
    userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
  };
}

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;
  const { user, token } = await login(getPrismaClient(), email, password, requestContext(req));
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.status(200).json({ success: true, data: { user } });
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  // Best-effort audit — if `req.user` is missing (e.g. cookie already
  // expired) we still want the cookie cleared, so we don't block on it.
  if (req.user) {
    await recordLogout(getPrismaClient(), req.user.id, requestContext(req));
  }
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
  res.status(204).end();
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  // requireAuth already attached req.user.
  const user = await getCurrentUser(getPrismaClient(), req.user!.id);
  res.status(200).json({ success: true, data: { user } });
});

export const forgotHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotInput;
  // Always 200 with a generic message — never leak whether the email exists.
  await requestPasswordReset(getPrismaClient(), email, requestContext(req));
  res.status(200).json({
    success: true,
    data: { message: "If an account exists for that email, a reset link has been sent." },
  });
});

export const resetHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as ResetInput;
  await completePasswordReset(getPrismaClient(), token, password, requestContext(req));
  res.status(200).json({
    success: true,
    data: { message: "Password has been reset. You can now sign in with your new password." },
  });
});
