import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import {
  assignLead,
  createLead,
  deleteLead,
  getLeadOrThrow,
  listLeads,
  updateLead,
} from "./leads.service";
import type {
  AssignLeadInput,
  CreateLeadInput,
  ListLeadsQuery,
  UpdateLeadInput,
} from "./leads.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const listLeadsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const query = req.query as unknown as ListLeadsQuery;
    const result = await listLeads(query, user);
    res.status(200).json({ success: true, data: result });
  },
);

export const getLeadController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const lead = await getLeadOrThrow(req.params.id, user);
    res.status(200).json({ success: true, data: lead });
  },
);

export const createLeadController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateLeadInput;
    const lead = await createLead(body);
    res.status(201).json({ success: true, data: lead });
  },
);

export const updateLeadController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    requireUser(req);
    const body = req.body as UpdateLeadInput;
    const lead = await updateLead(req.params.id, body);
    res.status(200).json({ success: true, data: lead });
  },
);

export const deleteLeadController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    requireUser(req);
    await deleteLead(req.params.id);
    res.status(200).json({ success: true, data: { ok: true } });
  },
);

export const assignLeadController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    requireUser(req);
    const body = req.body as AssignLeadInput;
    const lead = await assignLead(req.params.id, body);
    res.status(200).json({ success: true, data: lead });
  },
);
