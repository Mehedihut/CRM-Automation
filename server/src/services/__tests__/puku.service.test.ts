import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  approve,
  reject,
  updatePukuRequest,
  deletePukuRequest,
} from "../puku.service";
import { ApiError } from "../../utils/ApiError";
import { createMockPrisma, prismaKnownError, asPrisma, type MockPrisma } from "../../__tests__/createMockPrisma";

// Stub the Puku integration so approve() can complete its transaction path.
vi.mock("../../integrations/puku", () => ({
  pukuProvisionAccess: vi.fn().mockResolvedValue({ externalRef: "stub-1" }),
}));

const auditCtx = { ip: "10.0.0.1", userAgent: "vitest" };

function pendingRequest(
  overrides: Partial<{
    id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    requestedScope: string;
    reason: string;
    decidedById: number | null;
    decisionNote: string | null;
  }> = {},
) {
  return {
    id: 1,
    requesterName: "Req",
    requesterEmail: "req@example.com",
    requesterPhone: "+10000000000",
    requestedScope: "scope:read",
    reason: "because",
    status: "PENDING" as const,
    decidedById: null,
    decidedAt: null,
    decisionNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("puku.service.approve", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("updates status + writes PUKU_DECIDED audit row in one transaction", async () => {
    prisma.pukuAccessRequest.findUnique.mockResolvedValue(
      pendingRequest({ id: 42, requestedScope: "scope:admin" }),
    );
    prisma.pukuAccessRequest.update.mockResolvedValue(
      pendingRequest({ id: 42, status: "APPROVED", decidedById: 7 }),
    );

    const result = await approve(asPrisma(prisma), 42, 7, "looks good", auditCtx);

    expect(result.status).toBe("APPROVED");
    expect(result.decidedById).toBe(7);
    // Both ops happen via the tx handle — audit row never exists without the update.
    const txCalls = prisma.$transaction.mock.calls;
    expect(txCalls).toHaveLength(1);
    expect(prisma.pukuAccessRequest.update).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "PUKU_DECIDED",
        entity: "puku_request:42",
        actorId: 7,
        metadata: { decision: "APPROVED", note: "looks good" },
        ip: "10.0.0.1",
        userAgent: "vitest",
      }),
    });
  });

  it("throws 404 when the request doesn't exist", async () => {
    prisma.pukuAccessRequest.findUnique.mockResolvedValue(null);

    await expect(approve(asPrisma(prisma), 999, 1, undefined, auditCtx)).rejects.toMatchObject({
      status: 404,
      code: "PUKU_REQUEST_NOT_FOUND",
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("throws 409 when the request was already decided", async () => {
    prisma.pukuAccessRequest.findUnique.mockResolvedValue(
      pendingRequest({ status: "REJECTED" }),
    );

    await expect(approve(asPrisma(prisma), 1, 1, undefined, auditCtx)).rejects.toMatchObject({
      status: 409,
      code: "PUKU_REQUEST_ALREADY_DECIDED",
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("puku.service.reject", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("updates status + writes PUKU_DECIDED audit with decision=REJECTED", async () => {
    prisma.pukuAccessRequest.findUnique.mockResolvedValue(
      pendingRequest({ id: 5 }),
    );
    prisma.pukuAccessRequest.update.mockResolvedValue(
      pendingRequest({ id: 5, status: "REJECTED", decidedById: 9 }),
    );

    await reject(asPrisma(prisma), 5, 9, "no", auditCtx);

    expect(prisma.pukuAccessRequest.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: expect.objectContaining({
        status: "REJECTED",
        decidedById: 9,
        decisionNote: "no",
      }),
      include: expect.anything(),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "PUKU_DECIDED",
        entity: "puku_request:5",
        metadata: { decision: "REJECTED", note: "no" },
      }),
    });
  });

  it("throws 409 when the request was already approved", async () => {
    prisma.pukuAccessRequest.findUnique.mockResolvedValue(
      pendingRequest({ status: "APPROVED" }),
    );

    await expect(reject(asPrisma(prisma), 1, 1, undefined, auditCtx)).rejects.toMatchObject({
      status: 409,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("puku.service.updatePukuRequest", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("updates a PENDING request", async () => {
    prisma.pukuAccessRequest.findUnique.mockResolvedValue(
      pendingRequest(),
    );
    prisma.pukuAccessRequest.update.mockResolvedValue(
      pendingRequest({ reason: "new reason" }),
    );

    await updatePukuRequest(asPrisma(prisma), 1, { reason: "new reason" });
    expect(prisma.pukuAccessRequest.update).toHaveBeenCalled();
  });

  it("refuses to edit a non-PENDING request (locked after decide)", async () => {
    prisma.pukuAccessRequest.findUnique.mockResolvedValue(
      pendingRequest({ status: "APPROVED" }),
    );

    await expect(
      updatePukuRequest(asPrisma(prisma), 1, { reason: "nope" }),
    ).rejects.toMatchObject({
      status: 409,
      code: "PUKU_REQUEST_LOCKED",
    });
    expect(prisma.pukuAccessRequest.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the request doesn't exist", async () => {
    prisma.pukuAccessRequest.findUnique.mockResolvedValue(null);
    await expect(updatePukuRequest(asPrisma(prisma), 99, { reason: "x" })).rejects.toBeInstanceOf(ApiError);
  });
});

describe("puku.service.deletePukuRequest", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("translates Prisma P2025 into 404 ApiError", async () => {
    prisma.pukuAccessRequest.delete.mockRejectedValue(prismaKnownError("P2025"));

    await expect(deletePukuRequest(asPrisma(prisma), 404)).rejects.toMatchObject({
      status: 404,
      code: "PUKU_REQUEST_NOT_FOUND",
    });
  });

  it("rethrows unknown errors", async () => {
    prisma.pukuAccessRequest.delete.mockRejectedValue(
      new Error("db is down"),
    );

    await expect(deletePukuRequest(asPrisma(prisma), 1)).rejects.toThrow("db is down");
  });
});