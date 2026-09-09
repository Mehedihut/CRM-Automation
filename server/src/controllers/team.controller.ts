import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getPrismaClient } from "../config/prisma";
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMember,
  listTeam,
  updateTeamMember,
} from "../services/team.service";
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "../validators/team.schema";

// req.params.id is already coerced to a positive int by idParamSchema.
type IdParams = { id: number };

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listTeam(getPrismaClient());
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const data = await getTeamMember(getPrismaClient(), id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateTeamMemberInput;
  const data = await createTeamMember(getPrismaClient(), input);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  const input = req.body as UpdateTeamMemberInput;
  const data = await updateTeamMember(getPrismaClient(), id, input);
  res.status(200).json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParams;
  await deleteTeamMember(getPrismaClient(), id);
  res.status(204).end();
});
