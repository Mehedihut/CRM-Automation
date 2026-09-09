import { vi, type Mock } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";

/**
 * MockPrisma is the test-side shape of a PrismaClient: each model exposes
 * its CRUD methods as separate `vi.fn()`s so tests can configure return
 * values and assert call args directly. Service functions still expect a
 * `PrismaClient`, so callers cast with `asPrisma(mock)` at the boundary.
 */
export interface MockPrisma {
  user: Record<string, Mock>;
  lead: Record<string, Mock>;
  call: Record<string, Mock>;
  whatsAppMessage: Record<string, Mock>;
  followUp: Record<string, Mock>;
  pukuAccessRequest: Record<string, Mock>;
  auditLog: Record<string, Mock>;
  passwordResetToken: Record<string, Mock>;
  $queryRaw: Mock;
  $executeRaw: Mock;
  $transaction: Mock;
}

function modelMock(): Record<string, Mock> {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

/**
 * Build a Prisma mock where each method on each model is its own `vi.fn()`.
 * `$transaction(cb)` invokes the callback synchronously with the same per-
 * model mocks — matching the real Prisma client's contract.
 *
 * The return type is `MockPrisma` so tests can call `.mockResolvedValue` /
 * `.toHaveBeenCalledWith` directly. Pass `asPrisma(mock)` into service
 * functions.
 */
export function createMockPrisma(): MockPrisma {
  interface RawTx {
    user: Record<string, Mock>;
    lead: Record<string, Mock>;
    call: Record<string, Mock>;
    whatsAppMessage: Record<string, Mock>;
    followUp: Record<string, Mock>;
    pukuAccessRequest: Record<string, Mock>;
    auditLog: Record<string, Mock>;
    passwordResetToken: Record<string, Mock>;
    $queryRaw: Mock;
    $executeRaw: Mock;
  }

  const tx: RawTx = {
    user: modelMock(),
    lead: modelMock(),
    call: modelMock(),
    whatsAppMessage: modelMock(),
    followUp: modelMock(),
    pukuAccessRequest: modelMock(),
    auditLog: modelMock(),
    passwordResetToken: modelMock(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  };

  const prisma = {
    ...tx,
    $transaction: vi.fn(
      async <T>(cb: (tx: RawTx) => Promise<T> | T): Promise<T> => cb(tx),
    ),
  };

  return prisma;
}

/** Cast at the service boundary. Runtime is unchanged. */
export function asPrisma(mock: MockPrisma): PrismaClient {
  return mock as unknown as PrismaClient;
}

/**
 * Construct a Prisma "known request error" with the given code (P2002, P2003,
 * P2025, ...). Saves tests from repeating the long constructor + the unused
 * clientVersion field.
 */
export function prismaKnownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(code, {
    code,
    clientVersion: "test",
  });
}