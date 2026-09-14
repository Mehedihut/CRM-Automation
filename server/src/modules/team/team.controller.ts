import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createTeamMember,
  listAgents,
  listTeam,
  softDeleteTeamMember,
  updateTeamMember,
} from "./team.service";
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "./team.schema";

export const listTeamController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const items = await listTeam();
    res.status(200).json({ success: true, data: { items } });
  },
);

export const listAgentsController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const items = await listAgents();
    res.status(200).json({ success: true, data: { items } });
  },
);

export const createTeamMemberController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateTeamMemberInput;
    const member = await createTeamMember(body);
    res.status(201).json({ success: true, data: member });
  },
);

export const updateTeamMemberController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateTeamMemberInput;
    const member = await updateTeamMember(req.params.id, body);
    res.status(200).json({ success: true, data: member });
  },
);

export const deleteTeamMemberController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await softDeleteTeamMember(req.params.id);
    res.status(200).json({ success: true, data: { ok: true } });
  },
);
