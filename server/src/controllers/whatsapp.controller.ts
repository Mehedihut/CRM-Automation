import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getPrismaClient } from "../config/prisma";
import { createMessage, listMessagesForLead } from "../services/whatsapp.service";
import { whatsappSendMessage } from "../integrations/whatsapp";
import { ApiError } from "../utils/ApiError";
import type { CreateWhatsAppMessageInput } from "../validators/whatsapp.schema";

type IdParams = { id: number };
type MsgIdParams = { id: number };

export const listForLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const data = await listMessagesForLead(getPrismaClient(), id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const input = req.body as CreateWhatsAppMessageInput;
  const senderId = req.user!.id;
  const data = await createMessage(getPrismaClient(), id, input, senderId);
  res.status(201).json({ success: true, data });
});

export const sendStub = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as MsgIdParams;
  // Look up the message so the integration helper can use the lead phone.
  const prisma = getPrismaClient();
  const msg = await prisma.whatsAppMessage.findUnique({
    where: { id },
    include: { lead: { select: { phone: true } } },
  });
  if (!msg) {
    throw new ApiError(404, "MESSAGE_NOT_FOUND", "WhatsApp message not found");
  }
  // INTEGRATION TODO: real send via whatsappSendMessage(...)
  await whatsappSendMessage({ to: msg.lead.phone, body: msg.body });
  // unreachable — whatsappSendMessage throws 501
  res.status(200).json({ success: true, data: msg });
});
