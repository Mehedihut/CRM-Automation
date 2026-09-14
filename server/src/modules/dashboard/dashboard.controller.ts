import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getStats } from "./dashboard.service";

export const getStatsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const stats = await getStats(req.user);
    res.status(200).json({ success: true, data: stats });
  },
);
