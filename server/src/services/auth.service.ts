import type { PrismaClient, User } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { recordAudit } from "./audit.service";

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
}

export interface LoginContext {
  ip?: string | null;
  userAgent?: string | null;
}

function toSafe(user: User): SafeUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function login(
  prisma: PrismaClient,
  email: string,
  password: string,
  ctx: LoginContext = {},
): Promise<{ user: SafeUser; token: string }> {
  const normalized = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  // Single message for unknown email + wrong password — no email enumeration.
  const INVALID = ApiError.unauthorized("Invalid email or password");

  if (!user) {
    await recordAudit(prisma, {
      action: "AUTH_LOGIN_FAILURE",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { email: normalized },
    });
    throw INVALID;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await recordAudit(prisma, {
      action: "AUTH_LOGIN_FAILURE",
      actorId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw INVALID;
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  await recordAudit(prisma, {
    action: "AUTH_LOGIN_SUCCESS",
    actorId: user.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return { user: toSafe(user), token };
}

export async function recordLogout(
  prisma: PrismaClient,
  actorId: number,
  ctx: LoginContext = {},
): Promise<void> {
  await recordAudit(prisma, {
    action: "AUTH_LOGOUT",
    actorId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function getCurrentUser(prisma: PrismaClient, userId: number): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized("Session user no longer exists");
  return toSafe(user);
}
