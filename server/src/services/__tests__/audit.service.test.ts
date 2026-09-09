import { describe, expect, it, beforeEach, vi } from "vitest";
import { recordAudit } from "../audit.service";
import { createMockPrisma, asPrisma, type MockPrisma } from "../../__tests__/createMockPrisma";

describe("audit.service.recordAudit", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("normalizes undefined fields to null on the audit row", async () => {
    await recordAudit(asPrisma(prisma), { action: "AUTH_LOGIN_SUCCESS" });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "AUTH_LOGIN_SUCCESS",
        entity: null,
        actorId: null,
        ip: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });

  it("passes metadata through as-is", async () => {
    await recordAudit(asPrisma(prisma), {
      action: "LEAD_REASSIGNED",
      entity: "lead:5",
      actorId: 7,
      metadata: { from: 1, to: 2 },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "LEAD_REASSIGNED",
        entity: "lead:5",
        actorId: 7,
        metadata: { from: 1, to: 2 },
      }),
    });
  });
});