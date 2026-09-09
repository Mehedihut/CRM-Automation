import { PrismaClient, type WhatsAppMessage } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import type { CreateWhatsAppMessageInput } from "../validators/whatsapp.schema";

const senderSelect = { id: true, name: true, email: true } as const;
const messageInclude = { sender: { select: senderSelect } } as const;

export async function listMessagesForLead(
  prisma: PrismaClient,
  leadId: number,
): Promise<WhatsAppMessage[]> {
  return prisma.whatsAppMessage.findMany({
    where: { leadId },
    include: messageInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function createMessage(
  prisma: PrismaClient,
  leadId: number,
  input: CreateWhatsAppMessageInput,
  senderId: number | null,
): Promise<WhatsAppMessage> {
  // Ensure the lead exists so we can return LEAD_NOT_FOUND.
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) {
    throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
  }
  return prisma.whatsAppMessage.create({
    data: {
      leadId,
      senderId: input.direction === "OUTBOUND" ? senderId : null,
      direction: input.direction,
      body: input.body,
    },
    include: messageInclude,
  });
}
