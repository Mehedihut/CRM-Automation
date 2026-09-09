import { PrismaClient, Prisma, type FollowUp } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import type {
  CreateFollowUpInput,
  ListFollowUpsQuery,
  UpdateFollowUpInput,
} from "../validators/followups.schema";

const assigneeSelect = { id: true, name: true, email: true } as const;
const leadSelect = { id: true, name: true, phone: true } as const;
const followUpInclude = {
  assignee: { select: assigneeSelect },
  lead: { select: leadSelect },
} as const;

export async function listFollowUps(
  prisma: PrismaClient,
  filters: ListFollowUpsQuery,
): Promise<FollowUp[]> {
  const where: Prisma.FollowUpWhereInput = {};
  if (filters.assigneeId !== undefined) where.assigneeId = filters.assigneeId;
  if (filters.status !== undefined) where.status = filters.status;
  if (filters.leadId !== undefined) where.leadId = filters.leadId;
  if (filters.from || filters.to) {
    where.scheduledAt = {};
    if (filters.from) (where.scheduledAt as Prisma.DateTimeFilter).gte = filters.from;
    if (filters.to) (where.scheduledAt as Prisma.DateTimeFilter).lte = filters.to;
  }
  return prisma.followUp.findMany({
    where,
    include: followUpInclude,
    orderBy: { scheduledAt: "asc" },
  });
}

export async function getFollowUp(
  prisma: PrismaClient,
  id: number,
): Promise<FollowUp> {
  const fu = await prisma.followUp.findUnique({ where: { id }, include: followUpInclude });
  if (!fu) {
    throw new ApiError(404, "FOLLOWUP_NOT_FOUND", "Follow-up not found");
  }
  return fu;
}

export async function createFollowUp(
  prisma: PrismaClient,
  input: CreateFollowUpInput,
  defaultAssigneeId: number,
): Promise<FollowUp> {
  // Verify lead exists.
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId }, select: { id: true } });
  if (!lead) {
    throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
  }

  const assigneeId = input.assigneeId ?? defaultAssigneeId;
  const user = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } });
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "Assignee not found");
  }

  return prisma.followUp.create({
    data: {
      leadId: input.leadId,
      assigneeId,
      scheduledAt: input.scheduledAt,
      notes: input.notes,
    },
    include: followUpInclude,
  });
}

export async function updateFollowUp(
  prisma: PrismaClient,
  id: number,
  input: UpdateFollowUpInput,
): Promise<FollowUp> {
  try {
    const data: Prisma.FollowUpUpdateInput = {};
    if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt;
    if (input.status !== undefined) data.status = input.status;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.assigneeId !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: input.assigneeId },
        select: { id: true },
      });
      if (!user) {
        throw new ApiError(404, "USER_NOT_FOUND", "Assignee not found");
      }
      data.assignee = { connect: { id: input.assigneeId } };
    }
    return await prisma.followUp.update({ where: { id }, data, include: followUpInclude });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new ApiError(404, "FOLLOWUP_NOT_FOUND", "Follow-up not found");
    }
    throw err;
  }
}

export async function deleteFollowUp(prisma: PrismaClient, id: number): Promise<void> {
  try {
    await prisma.followUp.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new ApiError(404, "FOLLOWUP_NOT_FOUND", "Follow-up not found");
    }
    throw err;
  }
}
