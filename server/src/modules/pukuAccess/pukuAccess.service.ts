import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import type { JwtPayload } from "../../utils/jwt";
import type {
  DecidePukuInput,
  ListPukuQuery,
  RequestPukuInput,
} from "./pukuAccess.schema";

export async function listRequests(query: ListPukuQuery, user: JwtPayload) {
  const where: Prisma.PukuAccessRequestWhereInput = {};
  if (query.status) where.status = query.status;
  if (user.role === "AGENT") {
    where.OR = [{ requestedById: user.sub }, { lead: { assignedToId: user.sub } }];
  }
  return prisma.pukuAccessRequest.findMany({
    where,
    include: {
      lead: { select: { id: true, fullName: true } },
      requestedBy: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRequest(
  leadId: string,
  user: JwtPayload,
  input: RequestPukuInput,
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw ApiError.notFound("Lead not found");
  // Check for existing pending request for the same lead.
  const existing = await prisma.pukuAccessRequest.findFirst({
    where: { leadId, status: "PENDING" },
  });
  if (existing) {
    throw ApiError.conflict("There is already a pending Puku request for this lead");
  }
  return prisma.pukuAccessRequest.create({
    data: {
      leadId,
      requestedById: user.sub,
      reason: input.reason ?? null,
    },
    include: {
      lead: { select: { id: true, fullName: true } },
      requestedBy: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, name: true } },
    },
  });
}

export async function decideRequest(
  id: string,
  deciderId: string,
  input: DecidePukuInput,
) {
  const existing = await prisma.pukuAccessRequest.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Request not found");
  if (existing.status !== "PENDING") {
    throw ApiError.badRequest("This request has already been decided");
  }
  return prisma.pukuAccessRequest.update({
    where: { id },
    data: {
      status: input.status,
      reason: input.reason ?? null,
      decidedById: deciderId,
      decidedAt: new Date(),
    },
    include: {
      lead: { select: { id: true, fullName: true } },
      requestedBy: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, name: true } },
    },
  });
}

export async function listByLead(leadId: string) {
  return prisma.pukuAccessRequest.findMany({
    where: { leadId },
    include: {
      lead: { select: { id: true, fullName: true } },
      requestedBy: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
