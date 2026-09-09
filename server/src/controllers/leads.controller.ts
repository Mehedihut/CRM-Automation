import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getPrismaClient } from "../config/prisma";
import {
  assignLead,
  createLead,
  deleteLead,
  getLead,
  listLeads,
  updateLead,
} from "../services/leads.service";
import type {
  CreateLeadInput,
  ListLeadsQuery,
  UpdateLeadInput,
} from "../validators/leads.schema";
import type { AssignLeadInput } from "../validators/team.schema";

type IdParams = { id: number };

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ListLeadsQuery;
  const data = await listLeads(getPrismaClient(), filters);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const data = await getLead(getPrismaClient(), id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateLeadInput;
  const data = await createLead(getPrismaClient(), input);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const input = req.body as UpdateLeadInput;
  const data = await updateLead(getPrismaClient(), id, input);
  res.status(200).json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  await deleteLead(getPrismaClient(), id);
  res.status(204).end();
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const { userId } = req.body as AssignLeadInput;
  const data = await assignLead(getPrismaClient(), id, userId);
  res.status(200).json({ success: true, data });
});
