import { describe, expect, it, beforeEach } from "vitest";
import { WhatsAppDirection, type WhatsAppMessage } from "@prisma/client";
import { listMessagesForLead, createMessage } from "../whatsapp.service";
import { ApiError } from "../../utils/ApiError";
import { createMockPrisma, asPrisma, type MockPrisma } from "../../__tests__/createMockPrisma";

function msgRow(overrides: Partial<WhatsAppMessage> = {}): WhatsAppMessage {
  return {
    id: 1,
    leadId: 5,
    senderId: 7,
    direction: WhatsAppDirection.INBOUND,
    body: "hi",
    createdAt: new Date("2026-03-15T12:00:00.000Z"),
    ...overrides,
  } as WhatsAppMessage;
}

describe("whatsapp.service.listMessagesForLead", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("queries by leadId, includes the sender, and orders newest → oldest", async () => {
    prisma.whatsAppMessage.findMany.mockResolvedValue([]);

    await listMessagesForLead(asPrisma(prisma), 42);

    expect(prisma.whatsAppMessage.findMany).toHaveBeenCalledWith({
      where: { leadId: 42 },
      include: { sender: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns the rows as-is (including the populated sender)", async () => {
    const rows = [
      msgRow({ id: 1, body: "first" }),
      msgRow({ id: 2, body: "second" }),
    ];
    prisma.whatsAppMessage.findMany.mockResolvedValue(rows);

    await expect(listMessagesForLead(asPrisma(prisma), 5)).resolves.toEqual(rows);
  });
});

describe("whatsapp.service.createMessage", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("returns 404 LEAD_NOT_FOUND when the lead is missing", async () => {
    prisma.lead.findUnique.mockResolvedValue(null);

    await expect(
      createMessage(
        asPrisma(prisma),
        99,
        { direction: WhatsAppDirection.OUTBOUND, body: "hi" },
        7,
      ),
    ).rejects.toMatchObject({ status: 404, code: "LEAD_NOT_FOUND" });

    // Verify the existence check is scoped to the right lead id + select shape.
    expect(prisma.lead.findUnique).toHaveBeenCalledWith({
      where: { id: 99 },
      select: { id: true },
    });
    expect(prisma.whatsAppMessage.create).not.toHaveBeenCalled();
  });

  it("for OUTBOUND messages, sets senderId to the caller", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: 5 });
    prisma.whatsAppMessage.create.mockResolvedValue(
      msgRow({ leadId: 5, senderId: 7, direction: WhatsAppDirection.OUTBOUND }),
    );

    await createMessage(
      asPrisma(prisma),
      5,
      { direction: WhatsAppDirection.OUTBOUND, body: "hi" },
      7,
    );

    expect(prisma.whatsAppMessage.create).toHaveBeenCalledWith({
      data: {
        leadId: 5,
        senderId: 7,
        direction: WhatsAppDirection.OUTBOUND,
        body: "hi",
      },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
  });

  it("for INBOUND messages, always stores senderId=null regardless of the caller", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: 5 });
    prisma.whatsAppMessage.create.mockResolvedValue(
      msgRow({ leadId: 5, senderId: null, direction: WhatsAppDirection.INBOUND }),
    );

    await createMessage(
      asPrisma(prisma),
      5,
      { direction: WhatsAppDirection.INBOUND, body: "hi from customer" },
      7,
    );

    expect(prisma.whatsAppMessage.create).toHaveBeenCalledWith({
      data: {
        leadId: 5,
        senderId: null,
        direction: WhatsAppDirection.INBOUND,
        body: "hi from customer",
      },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
  });

  it("for OUTBOUND with a null senderId caller, stores null (we never spoof an agent)", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: 5 });
    prisma.whatsAppMessage.create.mockResolvedValue(
      msgRow({ leadId: 5, senderId: null, direction: WhatsAppDirection.OUTBOUND }),
    );

    await createMessage(
      asPrisma(prisma),
      5,
      { direction: WhatsAppDirection.OUTBOUND, body: "system note" },
      null,
    );

    expect(prisma.whatsAppMessage.create).toHaveBeenCalledWith({
      data: {
        leadId: 5,
        senderId: null,
        direction: WhatsAppDirection.OUTBOUND,
        body: "system note",
      },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
  });

  it("passes the ApiError through (no special Prisma-error mapping)", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: 5 });
    prisma.whatsAppMessage.create.mockRejectedValue(
      new ApiError(500, "BOOM", "kaboom"),
    );

    await expect(
      createMessage(
        asPrisma(prisma),
        5,
        { direction: WhatsAppDirection.OUTBOUND, body: "hi" },
        7,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
