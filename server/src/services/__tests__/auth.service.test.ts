import { describe, expect, it, beforeEach, vi } from "vitest";
import { login, getCurrentUser, recordLogout } from "../auth.service";
import { ApiError } from "../../utils/ApiError";
import { hashPassword } from "../../utils/password";
import { createMockPrisma, asPrisma, type MockPrisma } from "../../__tests__/createMockPrisma";

const ctx = { ip: "127.0.0.1", userAgent: "vitest" };

// Hash once at module load so each test reuses the same hash instead of
// re-running bcrypt for every user fixture (~50ms × N saved).
const sharedHashPromise = hashPassword("correct-pw");

function makeUser(overrides: Partial<{
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  passwordHash: string;
}> = {}): Promise<{
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  passwordHash: string;
}> {
  return sharedHashPromise.then((passwordHash) => ({
    id: 1,
    name: "User",
    email: "user@example.com",
    role: "AGENT",
    passwordHash,
    ...overrides,
  }));
}

describe("auth.service.login", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("returns a SafeUser and a signed token on valid credentials", async () => {
    const user = await makeUser({
      id: 7,
      name: "Ada",
      email: "ada@example.com",
      role: "ADMIN",
    });
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await login(asPrisma(prisma), "ada@example.com", "correct-pw", ctx);

    expect(result.user).toEqual({
      id: 7,
      name: "Ada",
      email: "ada@example.com",
      role: "ADMIN",
    });
    expect(result.token.split(".")).toHaveLength(3); // JWT header.payload.sig
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AUTH_LOGIN_SUCCESS",
        actorId: 7,
        ip: "127.0.0.1",
        userAgent: "vitest",
      }),
    });
  });

  it("lowercases the email before lookup", async () => {
    const user = await makeUser({ email: "bob@example.com" });
    prisma.user.findUnique.mockResolvedValue(user);

    await login(asPrisma(prisma), "BOB@example.com", "correct-pw", ctx);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "bob@example.com" },
    });
  });

  it("throws unauthorized + writes AUTH_LOGIN_FAILURE for unknown email", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      login(asPrisma(prisma), "ghost@example.com", "anything", ctx),
    ).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AUTH_LOGIN_FAILURE",
        actorId: null,
        metadata: { email: "ghost@example.com" },
      }),
    });
  });

  it("throws unauthorized + writes AUTH_LOGIN_FAILURE for wrong password", async () => {
    const user = await makeUser({ id: 42 });
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      login(asPrisma(prisma), "user@example.com", "wrong-pw", ctx),
    ).rejects.toBeInstanceOf(ApiError);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AUTH_LOGIN_FAILURE",
        actorId: 42,
      }),
    });
  });

  it("does not leak whether the email exists in the error message", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const a = login(asPrisma(prisma), "ghost@example.com", "x", ctx).catch((e) => e.message);

    const user = await makeUser({ email: "real@example.com" });
    prisma.user.findUnique.mockResolvedValue(user);
    const b = login(asPrisma(prisma), "real@example.com", "wrong", ctx).catch((e) => e.message);

    expect(await a).toBe(await b);
  });
});

describe("auth.service.getCurrentUser", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("returns a SafeUser when the row exists", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 3,
      name: "Eve",
      email: "eve@example.com",
      role: "AGENT",
    });
    await expect(getCurrentUser(asPrisma(prisma), 3)).resolves.toEqual({
      id: 3,
      name: "Eve",
      email: "eve@example.com",
      role: "AGENT",
    });
  });

  it("throws unauthorized when the user was deleted mid-session", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(getCurrentUser(asPrisma(prisma), 99)).rejects.toMatchObject({ status: 401 });
  });
});

describe("auth.service.recordLogout", () => {
  it("writes an AUTH_LOGOUT audit row", async () => {
    const prisma = createMockPrisma();
    await recordLogout(asPrisma(prisma), 7, ctx);
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AUTH_LOGOUT",
        actorId: 7,
        ip: "127.0.0.1",
        userAgent: "vitest",
      }),
    });
  });
});
