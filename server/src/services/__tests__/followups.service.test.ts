import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  getFollowUp,
  listFollowUps,
} from "../followups.service";
import { ApiError } from "../../utils/ApiError";
import { createMockPrisma, prismaKnownError, asPrisma, type MockPrisma } from "../../__tests__/createMockPrisma";

describe("followups.service.createFollowUp", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("creates a follow-up using the caller's userId as default assignee", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: 10 });
    prisma.user.findUnique.mockResolvedValue({ id: 7 });
    prisma.followUp.create.mockResolvedValue({ id: 1 });

    await createFollowUp(
      asPrisma(prisma),
      {
        leadId: 10,
        scheduledAt: new Date("2026-01-15T09:00:00Z"),
        notes: "call back",
      },
      7, // defaultAssigneeId
    );

    expect(prisma.followUp.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 10,
        assigneeId: 7,
        notes: "call back",
      }),
      include: expect.anything(),
    });
  });

  it("uses input.assigneeId when supplied (overrides the default)", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: 10 });
    prisma.user.findUnique.mockResolvedValue({ id: 8 });

    await createFollowUp(
      asPrisma(prisma),
      {
        leadId: 10,
        assigneeId: 8,
        scheduledAt: new Date(),
        notes: "x",
      },
      7,
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 8 },
      select: { id: true },
    });
    expect(prisma.followUp.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ assigneeId: 8 }),
      include: expect.anything(),
    });
  });

  it("returns 404 LEAD_NOT_FOUND when the lead doesn't exist", async () => {
    prisma.lead.findUnique.mockResolvedValue(null);

    await expect(
      createFollowUp(
        asPrisma(prisma),
        { leadId: 999, scheduledAt: new Date(), notes: "" },
        7,
      ),
    ).rejects.toMatchObject({ status: 404, code: "LEAD_NOT_FOUND" });
  });

  it("returns 404 USER_NOT_FOUND when the assignee doesn't exist", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: 10 });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      createFollowUp(
        asPrisma(prisma),
        { leadId: 10, scheduledAt: new Date(), notes: "" },
        7,
      ),
    ).rejects.toMatchObject({ status: 404, code: "USER_NOT_FOUND" });
  });
});

describe("followups.service.updateFollowUp", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("patches only the provided fields", async () => {
    prisma.followUp.update.mockResolvedValue({});

    await updateFollowUp(asPrisma(prisma), 1, { notes: "new" });

    expect(prisma.followUp.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { notes: "new" },
      include: expect.anything(),
    });
  });

  it("translates Prisma P2025 into 404", async () => {
    prisma.followUp.update.mockRejectedValue(prismaKnownError("P2025"));

    await expect(updateFollowUp(asPrisma(prisma), 1, { notes: "x" })).rejects.toMatchObject({
      status: 404,
      code: "FOLLOWUP_NOT_FOUND",
    });
  });
});

describe("followups.service.deleteFollowUp / getFollowUp", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("delete translates P2025 into 404", async () => {
    prisma.followUp.delete.mockRejectedValue(prismaKnownError("P2025"));

    await expect(deleteFollowUp(asPrisma(prisma), 99)).rejects.toBeInstanceOf(ApiError);
  });

  it("get throws 404 when missing", async () => {
    prisma.followUp.findUnique.mockResolvedValue(null);
    await expect(getFollowUp(asPrisma(prisma), 1)).rejects.toMatchObject({
      status: 404,
      code: "FOLLOWUP_NOT_FOUND",
    });
  });
});

describe("followups.service.listFollowUps", () => {
  it("builds a where clause from the filters", async () => {
    const prisma = createMockPrisma();
    prisma.followUp.findMany.mockResolvedValue([]);

    const from = new Date("2026-01-01");
    const to = new Date("2026-12-31");
    await listFollowUps(asPrisma(prisma), {
      assigneeId: 4,
      status: "PENDING",
      leadId: 9,
      from,
      to,
    });

    expect(prisma.followUp.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          assigneeId: 4,
          status: "PENDING",
          leadId: 9,
          scheduledAt: { gte: from, lte: to },
        }),
      }),
    );
  });
});