import { describe, expect, it, beforeEach, vi } from "vitest";
import { assignLead, updateLead, deleteLead, listLeads } from "../leads.service";
import { ApiError } from "../../utils/ApiError";
import { createMockPrisma, prismaKnownError, asPrisma, type MockPrisma } from "../../__tests__/createMockPrisma";

const auditCtx = { ip: "10.0.0.1", userAgent: "vitest" };

function leadRow(overrides: Partial<{ id: number; assignedTo: number | null; name: string; status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST" }> = {}) {
  return {
    id: 1,
    name: "Lead",
    phone: "+10000000000",
    email: null,
    source: null,
    notes: null,
    status: "NEW" as const,
    assignedTo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("leads.service.assignLead", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("updates assignment and writes LEAD_REASSIGNED audit in one tx", async () => {
    prisma.lead.findUnique.mockResolvedValue(
      leadRow({ id: 5, assignedTo: 10 }),
    );
    prisma.lead.update.mockResolvedValue(
      leadRow({ id: 5, assignedTo: 12 }),
    );

    const result = await assignLead(asPrisma(prisma), 5, 12, 7, auditCtx);

    expect(result.assignedTo).toBe(12);
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { assignedTo: 12 },
      include: expect.anything(),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "LEAD_REASSIGNED",
        entity: "lead:5",
        actorId: 7,
        metadata: { from: 10, to: 12 },
        ip: "10.0.0.1",
        userAgent: "vitest",
      }),
    });
  });

  it("captures previous assignee (null → userId) in audit metadata", async () => {
    prisma.lead.findUnique.mockResolvedValue(
      leadRow({ assignedTo: null }),
    );
    prisma.lead.update.mockResolvedValue(
      leadRow({ assignedTo: 99 }),
    );

    await assignLead(asPrisma(prisma), 1, 99, 7, auditCtx);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: { from: null, to: 99 },
      }),
    });
  });

  it("returns 404 LEAD_NOT_FOUND when the lead is missing", async () => {
    prisma.lead.findUnique.mockResolvedValue(null);

    await expect(assignLead(asPrisma(prisma), 999, 1, 1, auditCtx)).rejects.toMatchObject({
      status: 404,
      code: "LEAD_NOT_FOUND",
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("translates Prisma P2003 (FK violation) into USER_NOT_FOUND", async () => {
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.$transaction.mockImplementationOnce(async () => {
      throw prismaKnownError("P2003");
    });

    await expect(assignLead(asPrisma(prisma), 1, 999999, 1, auditCtx)).rejects.toMatchObject({
      status: 404,
      code: "USER_NOT_FOUND",
    });
  });
});

describe("leads.service.updateLead / deleteLead", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("translates P2025 → 404 LEAD_NOT_FOUND on update", async () => {
    prisma.lead.update.mockRejectedValue(prismaKnownError("P2025"));

    await expect(updateLead(asPrisma(prisma), 1, { name: "x" })).rejects.toMatchObject({
      status: 404,
      code: "LEAD_NOT_FOUND",
    });
  });

  it("translates P2025 → 404 LEAD_NOT_FOUND on delete", async () => {
    prisma.lead.delete.mockRejectedValue(prismaKnownError("P2025"));

    await expect(deleteLead(asPrisma(prisma), 1)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("leads.service.listLeads", () => {
  it("passes assigneeId + status into the where clause", async () => {
    const prisma = createMockPrisma();
    prisma.lead.findMany.mockResolvedValue([]);

    await listLeads(asPrisma(prisma), { assigneeId: 4, status: "NEW" });

    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assignedTo: 4, status: "NEW" },
      }),
    );
  });

  it("omits undefined filters from the where clause", async () => {
    const prisma = createMockPrisma();
    prisma.lead.findMany.mockResolvedValue([]);

    await listLeads(asPrisma(prisma), {});

    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });
});