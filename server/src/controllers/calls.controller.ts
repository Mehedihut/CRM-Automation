import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getPrismaClient } from "../config/prisma";
import { createCall, listCalls, listCallsForLead } from "../services/calls.service";
import type { CreateCallInput } from "../validators/calls.schema";

type IdParams = { id: number };

export const listAll = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listCalls(getPrismaClient());
  res.status(200).json({ success: true, data });
});

export const listForLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const data = await listCallsForLead(getPrismaClient(), id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateCallInput;
  const agentId = req.user!.id;
  const data = await createCall(getPrismaClient(), input, agentId);
  res.status(201).json({ success: true, data });
});
