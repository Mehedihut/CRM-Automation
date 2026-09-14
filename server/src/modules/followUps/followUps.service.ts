import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import type { JwtPayload } from "../../utils/jwt";
import type {
  ListFollowUpsQuery,
  ScheduleFollowUpInput,
  UpdateFollowUpInput,
} from "./followUps.schema";

export async function listFollowUps(query: ListFollowUpsQuery, user: JwtPayload) {
  const where: Prisma.FollowUpWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.assignedToMe) where.agentId = user.sub;
  else if (user.role === "AGENT") {
    // Agents by default see only their own.
    where.agentId = user.sub;
  }
  const items = await prisma.followUp.findMany({
    where,
    include: {
      agent: { select: { id: true, name: true } },
      lead: { select: { id: true, fullName: true } },
    },
    orderBy: { scheduledFor: "asc" },
  });
  return items;
}

export async function scheduleFollowUp(
  leadId: string,
  agentId: string,
  input: ScheduleFollowUpInput,
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw ApiError.notFound("Lead not found");
  return prisma.followUp.create({
    data: {
      leadId,
      agentId,
      scheduledFor: new Date(input.scheduledFor),
      note: input.note ?? null,
    },
    include: {
      agent: { select: { id: true, name: true } },
      lead: { select: { id: true, fullName: true } },
    },
  });
}

export async function updateFollowUp(id: string, input: UpdateFollowUpInput) {
  try {
    return await prisma.followUp.update({
      where: { id },
      data: {
        ...(input.scheduledFor !== undefined
          ? { scheduledFor: new Date(input.scheduledFor) }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
      },
      include: {
        agent: { select: { id: true, name: true } },
        lead: { select: { id: true, fullName: true } },
      },
    });
  } catch {
    throw ApiError.notFound("Follow-up not found");
  }
}

export async function deleteFollowUp(id: string) {
  try {
    await prisma.followUp.delete({ where: { id } });
  } catch {
    throw ApiError.notFound("Follow-up not found");
  }
}
