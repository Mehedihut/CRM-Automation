import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import type { LogCallInput } from "./calls.schema";

export async function listCallsByLead(leadId: string) {
  const calls = await prisma.call.findMany({
    where: { leadId },
    include: { agent: { select: { id: true, name: true } } },
    orderBy: { calledAt: "desc" },
  });
  return calls;
}

export async function logCall(
  leadId: string,
  agentId: string,
  input: LogCallInput,
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw ApiError.notFound("Lead not found");

  // Only persist course interests when the customer is interested. This keeps
  // the dashboard's "course interest" signal aligned with the explicit INTERESTED
  // outcome and prevents accidental pollution from CONNECTED-only calls.
  const courseIdsToPersist =
    input.outcome === "INTERESTED" && Array.isArray(input.courseIds)
      ? Array.from(new Set(input.courseIds))
      : [];

  const validCourseIds =
    courseIdsToPersist.length > 0
      ? (
          await prisma.course.findMany({
            where: { id: { in: courseIdsToPersist } },
            select: { id: true },
          })
        ).map((c) => c.id)
      : [];

  return prisma.$transaction(async (tx) => {
    const created = await tx.call.create({
      data: {
        leadId,
        agentId,
        outcome: input.outcome,
        durationSec: input.durationSec ?? null,
        notes: input.notes ?? null,
        calledAt: input.calledAt ? new Date(input.calledAt) : new Date(),
      },
      include: { agent: { select: { id: true, name: true } } },
    });

    if (validCourseIds.length > 0) {
      // Mirror the set (delete missing + create new) so course interests remain
      // in sync with the latest call's "next interested course" selection.
      await tx.leadCourseInterest.deleteMany({ where: { leadId } });
      await tx.leadCourseInterest.createMany({
        data: validCourseIds.map((courseId) => ({ leadId, courseId })),
      });
    }

    return created;
  });
}

export async function deleteCall(id: string) {
  try {
    await prisma.call.delete({ where: { id } });
  } catch {
    throw ApiError.notFound("Call not found");
  }
}
