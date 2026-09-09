import { PrismaClient, Prisma, type Lead, type LeadStatus } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import type {
  CreateLeadInput,
  UpdateLeadInput,
} from "../validators/leads.schema";

const assigneeSelect = {
  id: true,
  name: true,
  email: true,
} as const;

const leadInclude = { assignee: { select: assigneeSelect } } as const;

export async function listLeads(
  prisma: PrismaClient,
  filters: { assigneeId?: number; status?: LeadStatus } = {},
): Promise<Lead[]> {
  const where: Prisma.LeadWhereInput = {};
  if (filters.assigneeId !== undefined) where.assignedTo = filters.assigneeId;
  if (filters.status !== undefined) where.status = filters.status;

  return prisma.lead.findMany({
    where,
    include: leadInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getLead(
  prisma: PrismaClient,
  id: number,
): Promise<Lead> {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: leadInclude,
  });
  if (!lead) {
    throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
  }
  return lead;
}

export async function createLead(
  prisma: PrismaClient,
  input: CreateLeadInput,
): Promise<Lead> {
  return prisma.lead.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      source: input.source,
      notes: input.notes,
      // status + assignedTo fall back to schema defaults (NEW / null)
    },
  });
}

export async function updateLead(
  prisma: PrismaClient,
  id: number,
  input: UpdateLeadInput,
): Promise<Lead> {
  try {
    return await prisma.lead.update({
      where: { id },
      data: input,
      include: leadInclude,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
    }
    throw err;
  }
}

export async function deleteLead(
  prisma: PrismaClient,
  id: number,
): Promise<void> {
  try {
    await prisma.lead.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
    }
    throw err;
  }
}

export async function assignLead(
  prisma: PrismaClient,
  leadId: number,
  userId: number | null,
  actorId: number,
  auditCtx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<Lead> {
  // Capture the previous assignee so the audit row can show before/after.
  const before = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { assignedTo: true },
  });
  if (!before) {
    throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.lead.update({
        where: { id: leadId },
        data: { assignedTo: userId },
        include: leadInclude,
      });
      await tx.auditLog.create({
        data: {
          action: "LEAD_REASSIGNED",
          entity: `lead:${leadId}`,
          actorId,
          ip: auditCtx.ip ?? null,
          userAgent: auditCtx.userAgent ?? null,
          metadata: {
            from: before.assignedTo,
            to: userId,
          },
        },
      });
      return next;
    });
    logger.info("Lead assignment changed", { leadId, from: before.assignedTo, to: userId });
    return updated;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
      }
      if (err.code === "P2003") {
        throw new ApiError(404, "USER_NOT_FOUND", "User not found");
      }
    }
    throw err;
  }
}
