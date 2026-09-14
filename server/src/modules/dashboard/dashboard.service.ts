import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { JwtPayload } from "../../utils/jwt";
import { LeadStatus } from "../../utils/prismaEnums";

export type DomainLeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "FOLLOW_UP"
  | "CONVERTED"
  | "LOST";

export interface DashboardStats {
  totals: {
    leads: number;
    calls: number;
    whatsapps: number;
    pendingFollowUps: number;
    pukuPending: number;
  };
  leadsByStatus: Record<DomainLeadStatus, number>;
  recentActivity: Array<{
    kind: "call" | "whatsapp" | "followUp" | "puku" | "lead";
    at: string;
    summary: string;
    leadId?: string;
    leadName?: string;
  }>;
  agentPerformance: Array<{
    agentId: string;
    name: string;
    callsLogged: number;
    leadsAssigned: number;
    conversions: number;
  }>;
  courseInterest: Array<{
    courseId: string;
    courseName: string;
    isActive: boolean;
    interested: number;
    followUps: number;
    converted: number;
  }>;
}

const ALL_STATUSES: DomainLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "FOLLOW_UP",
  "CONVERTED",
  "LOST",
];

export async function getStats(_user: JwtPayload): Promise<DashboardStats> {

  const [
    leads,
    calls,
    whatsapps,
    pendingFollowUps,
    pukuPending,
    leadsByStatusRows,
    recentCalls,
    recentWhatsapps,
    recentFollowUps,
    recentLeads,
    agents,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.call.count(),
    prisma.whatsappMessage.count(),
    prisma.followUp.count({ where: { status: "PENDING" } }),
    prisma.pukuAccessRequest.count({ where: { status: "PENDING" } }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.call.findMany({
      orderBy: { calledAt: "desc" },
      take: 5,
      include: {
        agent: { select: { name: true } },
        lead: { select: { id: true, fullName: true } },
      },
    }),
    prisma.whatsappMessage.findMany({
      orderBy: { sentAt: "desc" },
      take: 5,
      include: {
        agent: { select: { name: true } },
        lead: { select: { id: true, fullName: true } },
      },
    }),
    prisma.followUp.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        agent: { select: { name: true } },
        lead: { select: { id: true, fullName: true } },
      },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "AGENT", active: true },
      select: { id: true, name: true },
    }),
  ]);

  const leadsByStatus: Record<DomainLeadStatus, number> = {
    NEW: 0,
    CONTACTED: 0,
    INTERESTED: 0,
    FOLLOW_UP: 0,
    CONVERTED: 0,
    LOST: 0,
  };
  for (const row of leadsByStatusRows) {
    leadsByStatus[row.status as DomainLeadStatus] = row._count._all;
  }

  type ActivityItem = DashboardStats["recentActivity"][number];
  const recentActivity: ActivityItem[] = [
    ...recentCalls.map((c) => ({
      kind: "call" as const,
      at: c.calledAt.toISOString(),
      summary: `${c.agent.name} → ${c.lead.fullName} (${c.outcome})`,
      leadId: c.lead.id,
      leadName: c.lead.fullName,
    })),
    ...recentWhatsapps.map((w) => ({
      kind: "whatsapp" as const,
      at: w.sentAt.toISOString(),
      summary: `${w.agent.name} ${w.direction === "OUTBOUND" ? "sent to" : "received from"} ${w.lead.fullName}`,
      leadId: w.lead.id,
      leadName: w.lead.fullName,
    })),
    ...recentFollowUps.map((f) => ({
      kind: "followUp" as const,
      at: f.createdAt.toISOString(),
      summary: `${f.agent.name} scheduled follow-up for ${f.lead.fullName}`,
      leadId: f.lead.id,
      leadName: f.lead.fullName,
    })),
    ...recentLeads.map((l) => ({
      kind: "lead" as const,
      at: l.createdAt.toISOString(),
      summary: `New lead: ${l.fullName}${l.assignedTo ? ` → ${l.assignedTo.name}` : ""}`,
      leadId: l.id,
      leadName: l.fullName,
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 10);

  const agentPerformance = await Promise.all(
    agents.map(async (a) => {
      const [callsLogged, leadsAssigned, conversions] = await Promise.all([
        prisma.call.count({ where: { agentId: a.id } }),
        prisma.lead.count({ where: { assignedToId: a.id } }),
        prisma.lead.count({
          where: { assignedToId: a.id, status: LeadStatus.CONVERTED },
        }),
      ]);
      return {
        agentId: a.id,
        name: a.name,
        callsLogged,
        leadsAssigned,
        conversions,
      };
    }),
  );

  // ── Course interest aggregates ───────────────────────────────────────────
  const courses = await prisma.course.findMany({
    include: {
      interests: {
        include: {
          lead: {
            select: {
              status: true,
              followUps: { where: { status: "PENDING" }, select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const courseInterest = courses.map((c) => {
    let interested = 0;
    let followUps = 0;
    let converted = 0;
    for (const i of c.interests) {
      interested += 1;
      if (i.lead.followUps.length > 0) followUps += 1;
      if (i.lead.status === LeadStatus.CONVERTED) converted += 1;
    }
    return {
      courseId: c.id,
      courseName: c.name,
      isActive: c.isActive,
      interested,
      followUps,
      converted,
    };
  });

  // Suppress unused-var warning while keeping the param for future per-user scoping.
  void _user;

  return {
    totals: {
      leads,
      calls,
      whatsapps,
      pendingFollowUps,
      pukuPending,
    },
    leadsByStatus,
    recentActivity,
    agentPerformance,
    courseInterest,
  };
}

// Keep `Prisma` imported as a type-only to avoid runtime side effects.
export type { Prisma };
