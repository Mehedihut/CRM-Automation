import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getPrismaClient } from "../config/prisma";
import type { Prisma } from "@prisma/client";
import type { ListAuditQuery } from "../validators/audit.schema";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListAuditQuery;
  const prisma = getPrismaClient();

  const where: Prisma.AuditLogWhereInput = {};
  if (q.action) where.action = q.action;
  if (q.entity) where.entity = q.entity;
  if (q.actorId !== undefined) where.actorId = q.actorId;
  if (q.from || q.to) {
    where.createdAt = {};
    if (q.from) where.createdAt.gte = q.from;
    if (q.to) where.createdAt.lte = q.to;
  }

  const limit = Math.min(q.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const rows = await prisma.auditLog.findMany({
    where,
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  res.status(200).json({ success: true, data: { items: data, nextCursor } });
});
