import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import type { JwtPayload } from "../../utils/jwt";
import type { SetLeadInterestsInput } from "./interests.schema";

export interface LeadInterestDTO {
  id: string;
  courseId: string;
  course: {
    id: string;
    name: string;
    isActive: boolean;
  };
  createdAt: string;
}

async function assertLeadAccessible(leadId: string, user: JwtPayload) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw ApiError.notFound("Lead not found");
  if (user.role === "AGENT" && lead.assignedToId && lead.assignedToId !== user.sub) {
    throw ApiError.forbidden("You can only modify your own assigned leads");
  }
  return lead;
}

export async function getInterestsByLead(
  leadId: string,
  user: JwtPayload,
): Promise<LeadInterestDTO[]> {
  await assertLeadAccessible(leadId, user);
  const rows = await prisma.leadCourseInterest.findMany({
    where: { leadId },
    include: { course: { select: { id: true, name: true, isActive: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    courseId: r.courseId,
    course: r.course,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function setLeadInterests(
  leadId: string,
  user: JwtPayload,
  input: SetLeadInterestsInput,
): Promise<LeadInterestDTO[]> {
  await assertLeadAccessible(leadId, user);

  const uniqueIds = Array.from(new Set(input.courseIds));
  if (uniqueIds.length > 0) {
    const found = await prisma.course.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (found.length !== uniqueIds.length) {
      throw ApiError.badRequest("One or more courseIds are invalid");
    }
  }

  await prisma.$transaction([
    prisma.leadCourseInterest.deleteMany({ where: { leadId } }),
    ...(uniqueIds.length > 0
      ? [
          prisma.leadCourseInterest.createMany({
            data: uniqueIds.map((courseId) => ({ leadId, courseId })),
          }),
        ]
      : []),
  ]);

  return getInterestsByLead(leadId, user);
}
