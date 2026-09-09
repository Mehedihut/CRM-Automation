import { PrismaClient, Prisma, CallOutcome, LeadStatus, type Call } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import type { CreateCallInput } from "../validators/calls.schema";

const agentSelect = { id: true, name: true, email: true } as const;
const callInclude = { agent: { select: agentSelect } } as const;

const STATUS_BY_OUTCOME: Record<CallOutcome, LeadStatus | null> = {
  CONTACTED: "CONTACTED",
  INTERESTED: "INTERESTED",
  CONVERTED: "CONVERTED",
  // Don't regress an INTERESTED/CONVERTED lead to a worse status.
  NOT_INTERESTED: "CONTACTED",
  UNREACHABLE: "CONTACTED",
  FOLLOW_UP_SCHEDULED: null, // leave status unchanged
};

const LOCKED_STATUSES: LeadStatus[] = ["CONVERTED"];

function nextStatus(current: LeadStatus, outcome: CallOutcome): LeadStatus {
  const proposed = STATUS_BY_OUTCOME[outcome];
  if (proposed === null) return current;
  if (LOCKED_STATUSES.includes(current)) return current;
  return proposed;
}

export async function listCallsForLead(
  prisma: PrismaClient,
  leadId: number,
): Promise<Call[]> {
  return prisma.call.findMany({
    where: { leadId },
    include: callInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listCalls(prisma: PrismaClient): Promise<Call[]> {
  return prisma.call.findMany({
    include: callInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function createCall(
  prisma: PrismaClient,
  input: CreateCallInput,
  agentId: number,
): Promise<Call> {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: input.leadId } });
    if (!lead) {
      throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
    }
    const call = await tx.call.create({
      data: {
        leadId: input.leadId,
        agentId,
        outcome: input.outcome,
        notes: input.notes,
        duration: input.duration,
      },
      include: callInclude,
    });

    const updated = nextStatus(lead.status, input.outcome);
    if (updated !== lead.status) {
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: updated },
      });
      logger.info("Lead status updated by call", {
        leadId: lead.id,
        from: lead.status,
        to: updated,
        outcome: input.outcome,
      });
    }

    return call;
  }).catch((err: unknown) => {
    if (err instanceof ApiError) throw err;
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003") {
        throw new ApiError(404, "AGENT_NOT_FOUND", "Agent not found");
      }
    }
    throw err;
  });
}
