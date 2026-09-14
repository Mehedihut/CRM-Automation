import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import {
  deleteFollowUp,
  listFollowUps,
  scheduleFollowUp,
  updateFollowUp,
} from "./followUps.service";
import type {
  ListFollowUpsQuery,
  ScheduleFollowUpInput,
  UpdateFollowUpInput,
} from "./followUps.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const listFollowUpsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const items = await listFollowUps(req.query as unknown as ListFollowUpsQuery, user);
    res.status(200).json({ success: true, data: { items } });
  },
);

export const scheduleFollowUpController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const body = req.body as ScheduleFollowUpInput;
    const created = await scheduleFollowUp(req.params.leadId, user.sub, body);
    res.status(201).json({ success: true, data: created });
  },
);

export const updateFollowUpController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateFollowUpInput;
    const updated = await updateFollowUp(req.params.id, body);
    res.status(200).json({ success: true, data: updated });
  },
);

export const deleteFollowUpController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await deleteFollowUp(req.params.id);
    res.status(200).json({ success: true, data: { ok: true } });
  },
);
