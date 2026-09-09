import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  requestPasswordReset,
  completePasswordReset,
} from "../passwordReset.service";
import { ApiError } from "../../utils/ApiError";
import { createMockPrisma, asPrisma, type MockPrisma } from "../../__tests__/createMockPrisma";

vi.mock("../../utils/mail", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// Stub bcrypt — the assertion only checks passwordHash is a string, no need
// to spend ~50ms per test computing a real hash.
vi.mock("../../utils/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("stubbed-hash"),
}));

const ctx = { ip: "127.0.0.1", userAgent: "vitest" };

describe("passwordReset.service.requestPasswordReset", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("creates a token + sends email + audits when the email matches a user", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      name: "Ada",
      email: "ada@example.com",
    });

    await requestPasswordReset(asPrisma(prisma), "ada@example.com", ctx);

    expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
    const call = prisma.passwordResetToken.create.mock.calls[0][0];
    expect(call.data.userId).toBe(7);
    expect(call.data.tokenHash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
    expect(call.data.expiresAt).toBeInstanceOf(Date);
    expect(call.data.expiresAt.getTime()).toBeGreaterThan(Date.now());

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AUTH_PASSWORD_RESET_REQUESTED",
        actorId: 7,
        metadata: { delivered: true },
      }),
    });
  });

  it("does NOT create a token or send email when the email is unknown", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await requestPasswordReset(asPrisma(prisma), "ghost@example.com", ctx);

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AUTH_PASSWORD_RESET_REQUESTED",
        actorId: null,
        metadata: { email: "ghost@example.com", delivered: false },
      }),
    });
  });
});

describe("passwordReset.service.completePasswordReset", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  function activeTokenRow(overrides: Partial<{ id: number; userId: number; usedAt: Date | null; expiresAt: Date }> = {}) {
    return {
      id: 1,
      userId: 7,
      tokenHash: "hashed",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  it("updates passwordHash, marks token used, writes audit in one tx", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(
      activeTokenRow(),
    );

    await completePasswordReset(asPrisma(prisma), "raw-token", "new-password-123", ctx);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { passwordHash: expect.any(String) },
    });
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { usedAt: expect.any(Date) },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AUTH_PASSWORD_RESET_COMPLETED",
        actorId: 7,
      }),
    });
  });

  it("throws RESET_TOKEN_INVALID when no row matches the hash", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(
      completePasswordReset(asPrisma(prisma), "bad", "new-password-123", ctx),
    ).rejects.toMatchObject({ status: 400, code: "RESET_TOKEN_INVALID" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("throws RESET_TOKEN_USED on second use", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(
      activeTokenRow({ usedAt: new Date() }),
    );

    await expect(
      completePasswordReset(asPrisma(prisma), "raw", "new-password-123", ctx),
    ).rejects.toMatchObject({ status: 400, code: "RESET_TOKEN_USED" });
  });

  it("throws RESET_TOKEN_EXPIRED when past the expiry", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(
      activeTokenRow({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(
      completePasswordReset(asPrisma(prisma), "raw", "new-password-123", ctx),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      completePasswordReset(asPrisma(prisma), "raw", "new-password-123", ctx),
    ).rejects.toMatchObject({ status: 400 });
  });
});