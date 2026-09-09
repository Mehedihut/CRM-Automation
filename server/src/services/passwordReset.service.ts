import type { PrismaClient } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { hashPassword } from "../utils/password";
import { generateRawToken, hashToken } from "../utils/tokens";
import { sendPasswordResetEmail } from "../utils/mail";
import { recordAudit } from "./audit.service";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Begin a password reset. Always returns void — the caller cannot tell
 * whether the email matched a real user. Audit row distinguishes the two
 * for ops, not for end users.
 */
export async function requestPasswordReset(
  prisma: PrismaClient,
  email: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<void> {
  const normalized = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  if (!user) {
    // No email sent; no token row; no enumeration signal to the client.
    await recordAudit(prisma, {
      action: "AUTH_PASSWORD_RESET_REQUESTED",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { email: normalized, delivered: false },
    });
    return;
  }

  const rawToken = generateRawToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  await sendPasswordResetEmail({ to: user.email, toName: user.name, rawToken });

  await recordAudit(prisma, {
    action: "AUTH_PASSWORD_RESET_REQUESTED",
    actorId: user.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    metadata: { delivered: true },
  });
}

/**
 * Complete a password reset using a token from the email link. Throws
 * `ApiError.badRequest` when the token is missing/expired/already-used.
 */
export async function completePasswordReset(
  prisma: PrismaClient,
  rawToken: string,
  newPassword: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!row) {
    throw new ApiError(400, "RESET_TOKEN_INVALID", "Invalid or expired reset link.");
  }
  if (row.usedAt) {
    throw new ApiError(400, "RESET_TOKEN_USED", "This reset link has already been used.");
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "RESET_TOKEN_EXPIRED", "This reset link has expired.");
  }

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash: newHash },
    });
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        action: "AUTH_PASSWORD_RESET_COMPLETED",
        actorId: row.userId,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
  });
}
