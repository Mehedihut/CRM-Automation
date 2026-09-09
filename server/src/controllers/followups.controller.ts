import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getPrismaClient } from "../config/prisma";
import {
  createFollowUp,
  deleteFollowUp,
  getFollowUp,
  listFollowUps,
  updateFollowUp,
} from "../services/followups.service";
import type {
  CreateFollowUpInput,
  ListFollowUpsQuery,
  UpdateFollowUpInput,
} from "../validators/followups.schema";

type IdParams = { id: number };

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ListFollowUpsQuery;
  const data = await listFollowUps(getPrismaClient(), filters);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const data = await getFollowUp(getPrismaClient(), id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateFollowUpInput;
  const data = await createFollowUp(getPrismaClient(), input, req.user!.id);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const input = req.body as UpdateFollowUpInput;
  const data = await updateFollowUp(getPrismaClient(), id, input);
  res.status(200).json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  await deleteFollowUp(getPrismaClient(), id);
  res.status(204).end();
});
