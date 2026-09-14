import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { deleteMessage, listByLead, logMessage } from "./whatsapp.service";
import type { LogWhatsappInput } from "./whatsapp.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const listMessagesController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const items = await listByLead(req.params.leadId);
    res.status(200).json({ success: true, data: { items } });
  },
);

export const logMessageController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const body = req.body as LogWhatsappInput;
    const created = await logMessage(req.params.leadId, user.sub, body);
    res.status(201).json({ success: true, data: created });
  },
);

export const deleteMessageController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await deleteMessage(req.params.id);
    res.status(200).json({ success: true, data: { ok: true } });
  },
);
