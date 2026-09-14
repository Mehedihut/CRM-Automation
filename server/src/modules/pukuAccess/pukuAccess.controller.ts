import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import {
  createRequest,
  decideRequest,
  listByLead,
  listRequests,
} from "./pukuAccess.service";
import type {
  DecidePukuInput,
  ListPukuQuery,
  RequestPukuInput,
} from "./pukuAccess.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const listRequestsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const items = await listRequests(req.query as unknown as ListPukuQuery, user);
    res.status(200).json({ success: true, data: { items } });
  },
);

export const createRequestController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const body = req.body as RequestPukuInput;
    const created = await createRequest(req.params.leadId, user, body);
    res.status(201).json({ success: true, data: created });
  },
);

export const decideRequestController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const body = req.body as DecidePukuInput;
    const updated = await decideRequest(req.params.id, user.sub, body);
    res.status(200).json({ success: true, data: updated });
  },
);

export const listByLeadController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const items = await listByLead(req.params.leadId);
    res.status(200).json({ success: true, data: { items } });
  },
);
