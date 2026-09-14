import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import type { LogWhatsappInput } from "./whatsapp.schema";

export async function listByLead(leadId: string) {
  return prisma.whatsappMessage.findMany({
    where: { leadId },
    include: { agent: { select: { id: true, name: true } } },
    orderBy: { sentAt: "desc" },
  });
}

export async function logMessage(
  leadId: string,
  agentId: string,
  input: LogWhatsappInput,
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw ApiError.notFound("Lead not found");
  return prisma.whatsappMessage.create({
    data: {
      leadId,
      agentId,
      direction: input.direction,
      body: input.body,
      sentAt: input.sentAt ? new Date(input.sentAt) : new Date(),
    },
    include: { agent: { select: { id: true, name: true } } },
  });
}

export async function deleteMessage(id: string) {
  try {
    await prisma.whatsappMessage.delete({ where: { id } });
  } catch {
    throw ApiError.notFound("Message not found");
  }
}
