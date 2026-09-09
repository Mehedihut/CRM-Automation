import { describe, expect, it, beforeEach, vi } from "vitest";
import { createCall } from "../calls.service";
import { ApiError } from "../../utils/ApiError";
import { createMockPrisma, prismaKnownError, asPrisma, type MockPrisma } from "../../__tests__/createMockPrisma";

function leadRow(status: "NEW" | "CONTACTED" | "INTERESTED" | "CONVERTED" | "LOST" = "NEW") {
  return {
    id: 1,
    name: "Lead",
    phone: "+10000000000",
    email: null,
    source: null,
    notes: null,
    status,
    assignedTo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const baseInput = {
  leadId: 1,
  outcome: "CONTACTED" as const,
  notes: "left voicemail",
  duration: 30,
};

describe("calls.service.createCall", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.call.create.mockResolvedValue({
      id: 99,
      leadId: 1,
      agentId: 7,
      outcome: "CONTACTED",
      notes: "left voicemail",
      duration: 30,
      createdAt: new Date(),
    });
  });

  it("returns 404 LEAD_NOT_FOUND when lead is missing", async () => {
    prisma.lead.findUnique.mockResolvedValue(null);

    await expect(createCall(asPrisma(prisma), baseInput, 7)).rejects.toMatchObject({
      status: 404,
      code: "LEAD_NOT_FOUND",
    });
    expect(prisma.call.create).not.toHaveBeenCalled();
  });

  it("creates the call and bumps a NEW lead to CONTACTED on CONTACTED outcome", async () => {
    prisma.lead.findUnique.mockResolvedValue(leadRow("NEW"));

    await createCall(asPrisma(prisma), baseInput, 7);

    expect(prisma.call.create).toHaveBeenCalled();
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: "CONTACTED" },
    });
  });

  it("does NOT regress a CONVERTED lead back to a worse status", async () => {
    prisma.lead.findUnique.mockResolvedValue(
      leadRow("CONVERTED"),
    );

    await createCall(
      asPrisma(prisma),
      { ...baseInput, outcome: "NOT_INTERESTED" },
      7,
    );

    expect(prisma.call.create).toHaveBeenCalled();
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  it("FOLLOW_UP_SCHEDULED outcome does not change lead status", async () => {
    prisma.lead.findUnique.mockResolvedValue(
      leadRow("INTERESTED"),
    );

    await createCall(
      asPrisma(prisma),
      { ...baseInput, outcome: "FOLLOW_UP_SCHEDULED" },
      7,
    );

    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  it("CONVERTED outcome locks the lead to CONVERTED", async () => {
    prisma.lead.findUnique.mockResolvedValue(
      leadRow("NEW"),
    );

    await createCall(asPrisma(prisma), { ...baseInput, outcome: "CONVERTED" }, 7);

    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: "CONVERTED" },
    });
  });

  it("translates Prisma P2003 (agent FK) into 404 AGENT_NOT_FOUND", async () => {
    prisma.lead.findUnique.mockResolvedValue(leadRow());
    prisma.$transaction.mockImplementationOnce(async () => {
      throw prismaKnownError("P2003");
    });

    await expect(createCall(asPrisma(prisma), baseInput, 999999)).rejects.toMatchObject({
      status: 404,
      code: "AGENT_NOT_FOUND",
    });
  });
});