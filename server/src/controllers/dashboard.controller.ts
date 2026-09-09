import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getPrismaClient } from "../config/prisma";
import { getDashboardStats } from "../services/dashboard.service";

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getDashboardStats(getPrismaClient());
  res.status(200).json({ success: true, data });
});
