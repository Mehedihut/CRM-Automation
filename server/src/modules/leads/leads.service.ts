import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import type { JwtPayload } from "../../utils/jwt";
import type {
  AssignLeadInput,
  CreateLeadInput,
  ListLeadsQuery,
  UpdateLeadInput,
} from "./leads.schema";

export interface LeadListResult {
  items: Awaited<ReturnType<typeof getLeadOrThrow>>[];
  total: number;
  page: number;
  pageSize: number;
}

const LEAD_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true } },
  courseInterests: {
    include: { course: { select: { id: true, name: true, isActive: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function listLeads(
  query: ListLeadsQuery,
  user: JwtPayload,
): Promise<LeadListResult> {
  const where: Prisma.LeadWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.assignedToId) where.assignedToId = query.assignedToId;
  if (query.courseId) {
    where.courseInterests = { some: { courseId: query.courseId } };
  }

  // Scope rule: agents only see leads assigned to them OR unassigned.
  if (user.role === "AGENT") {
    where.OR = [{ assignedToId: user.sub }, { assignedToId: null }];
  }

  if (query.search) {
    const searchFilter: Prisma.LeadWhereInput = {
      OR: [
        { fullName: { contains: query.search } },
        { email: { contains: query.search } },
        { phone: { contains: query.search } },
        { company: { contains: query.search } },
      ],
    };
    where.AND = [searchFilter];
  }

  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: LEAD_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
    }),
    prisma.lead.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getLeadOrThrow(id: string, user: JwtPayload) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: LEAD_INCLUDE,
  });
  if (!lead) throw ApiError.notFound("Lead not found");
  if (user.role === "AGENT" && lead.assignedToId && lead.assignedToId !== user.sub) {
    throw ApiError.forbidden("You can only view your own assigned leads");
  }
  return lead;
}

export async function createLead(input: CreateLeadInput) {
  return prisma.lead.create({
    data: {
      fullName: input.fullName,
      email: input.email || null,
      phone: input.phone,
      company: input.company || null,
      source: input.source || null,
      notes: input.notes || null,
      status: input.status ?? "NEW",
      assignedToId: input.assignedToId ?? null,
    },
    include: LEAD_INCLUDE,
  });
}

export async function updateLead(id: string, input: UpdateLeadInput) {
  try {
    return await prisma.lead.update({
      where: { id },
      data: {
        fullName: input.fullName,
        email: input.email === "" ? null : input.email,
        phone: input.phone,
        company: input.company === "" ? null : input.company,
        source: input.source === "" ? null : input.source,
        notes: input.notes === "" ? null : input.notes,
        status: input.status,
        assignedToId: input.assignedToId,
      },
      include: LEAD_INCLUDE,
    });
  } catch {
    throw ApiError.notFound("Lead not found");
  }
}

export async function deleteLead(id: string) {
  try {
    await prisma.lead.delete({ where: { id } });
  } catch {
    throw ApiError.notFound("Lead not found");
  }
}

export async function assignLead(id: string, input: AssignLeadInput) {
  if (input.assignedToId) {
    const exists = await prisma.user.findUnique({ where: { id: input.assignedToId } });
    if (!exists || !exists.active) throw ApiError.badRequest("Invalid agent");
  }
  try {
    return await prisma.lead.update({
      where: { id },
      data: { assignedToId: input.assignedToId },
      include: LEAD_INCLUDE,
    });
  } catch {
    throw ApiError.notFound("Lead not found");
  }
}
