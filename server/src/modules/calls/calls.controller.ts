import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { deleteCall, listCallsByLead, logCall } from "./calls.service";
import type { LogCallInput } from "./calls.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const listCallsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const items = await listCallsByLead(req.params.leadId);
    res.status(200).json({ success: true, data: { items } });
  },
);

export const logCallController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const body = req.body as LogCallInput;
    const created = await logCall(req.params.leadId, user.sub, body);
    res.status(201).json({ success: true, data: created });
  },
);

export const deleteCallController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await deleteCall(req.params.id);
    res.status(200).json({ success: true, data: { ok: true } });
  },
);
