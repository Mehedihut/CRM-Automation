import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getInterestsByLead, setLeadInterests } from "./interests.service";
import type { SetLeadInterestsInput } from "./interests.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const getInterestsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const items = await getInterestsByLead(req.params.leadId, user);
    res.status(200).json({ success: true, data: { items } });
  },
);

export const setInterestsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const body = req.body as SetLeadInterestsInput;
    const items = await setLeadInterests(req.params.leadId, user, body);
    res.status(200).json({ success: true, data: { items } });
  },
);
