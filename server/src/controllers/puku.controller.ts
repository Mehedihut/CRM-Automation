import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getPrismaClient } from "../config/prisma";
import {
  approve,
  createPukuRequest,
  deletePukuRequest,
  getPukuRequest,
  listPukuRequests,
  reject,
  updatePukuRequest,
} from "../services/puku.service";
import type {
  CreatePukuRequestInput,
  DecisionInput,
  ListPukuRequestsQuery,
  UpdatePukuRequestInput,
} from "../validators/puku.schema";

type IdParams = { id: number };

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ListPukuRequestsQuery;
  const data = await listPukuRequests(getPrismaClient(), filters);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const data = await getPukuRequest(getPrismaClient(), id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreatePukuRequestInput;
  const data = await createPukuRequest(getPrismaClient(), input);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const input = req.body as UpdatePukuRequestInput;
  const data = await updatePukuRequest(getPrismaClient(), id, input);
  res.status(200).json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  await deletePukuRequest(getPrismaClient(), id);
  res.status(204).end();
});

export const approveHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const { note } = req.body as DecisionInput;
  const data = await approve(getPrismaClient(), id, req.user!.id, note);
  res.status(200).json({ success: true, data });
});

export const rejectHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const { note } = req.body as DecisionInput;
  const data = await reject(getPrismaClient(), id, req.user!.id, note);
  res.status(200).json({ success: true, data });
});
