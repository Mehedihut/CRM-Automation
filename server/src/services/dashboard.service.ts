import {
  CallOutcome,
  FollowUpStatus,
  LeadStatus,
  type PrismaClient,
  PukuRequestStatus,
  WhatsAppDirection,
} from "@prisma/client";

export interface DashboardStats {
  leads: {
    total: number;
    byStatus: Record<LeadStatus, number>;
    unassigned: number;
    byAssignee: { userId: number; name: string; count: number }[];
  };
  calls: {
    total: number;
    byOutcome: Record<CallOutcome, number>;
    last7Days: { date: string; count: number }[];
  };
  followUps: {
    dueToday: number;
    overdue: number;
    pending: number;
  };
  whatsapp: {
    sentToday: number;
    receivedToday: number;
  };
  puku: {
    byStatus: Record<PukuRequestStatus, number>;
  };
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "NOT_INTERESTED",
  "UNREACHABLE",
  "CONVERTED",
];
const CALL_OUTCOMES: CallOutcome[] = [
  "CONTACTED",
  "INTERESTED",
  "NOT_INTERESTED",
  "UNREACHABLE",
  "CONVERTED",
  "FOLLOW_UP_SCHEDULED",
];
const PUKU_STATUSES: PukuRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function zeroed<T extends string>(keys: T[]): Record<T, number> {
  return keys.reduce(
    (acc, k) => {
      acc[k] = 0;
      return acc;
    },
    {} as Record<T, number>,
  );
}

export async function getDashboardStats(prisma: PrismaClient): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = startOfDayUTC(now);
  const tomorrowStart = addDays(todayStart, 1);
  const sevenDaysAgoStart = addDays(todayStart, -6); // include today → 7 buckets

  const leadsByAssigneePromise = prisma.lead.groupBy({
    by: ["assignedTo"],
    _count: { _all: true },
    where: { assignedTo: { not: null } },
  });

  const [
    leadTotal,
    leadGroup,
    leadUnassigned,
    leadsByAssignee,
    callsGroup,
    callsSince,
    followUpsDueToday,
    followUpsOverdue,
    followUpsPending,
    whatsappSentToday,
    whatsappReceivedToday,
    pukuGroup,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.count({ where: { assignedTo: null } }),
    leadsByAssigneePromise,
    prisma.call.groupBy({ by: ["outcome"], _count: { _all: true } }),
    prisma.call.findMany({
      where: { createdAt: { gte: sevenDaysAgoStart } },
      select: { createdAt: true },
    }),
    prisma.followUp.count({
      where: {
        status: FollowUpStatus.PENDING,
        scheduledAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.followUp.count({
      where: {
        status: FollowUpStatus.PENDING,
        scheduledAt: { lt: todayStart },
      },
    }),
    prisma.followUp.count({ where: { status: FollowUpStatus.PENDING } }),
    prisma.whatsAppMessage.count({
      where: {
        direction: WhatsAppDirection.OUTBOUND,
        createdAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.whatsAppMessage.count({
      where: {
        direction: WhatsAppDirection.INBOUND,
        createdAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.pukuAccessRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const byStatus = zeroed(LEAD_STATUSES);
  for (const row of leadGroup) byStatus[row.status] = row._count._all;

  const byOutcome = zeroed(CALL_OUTCOMES);
  for (const row of callsGroup) byOutcome[row.outcome] = row._count._all;

  const pukuByStatus = zeroed(PUKU_STATUSES);
  for (const row of pukuGroup) pukuByStatus[row.status] = row._count._all;

  // Bucket calls-per-day for the last 7 days (oldest → newest).
  const buckets: Record<string, number> = {};
  for (let i = 0; i < 7; i++) buckets[isoDate(addDays(sevenDaysAgoStart, i))] = 0;
  for (const row of callsSince) {
    const key = isoDate(startOfDayUTC(row.createdAt));
    if (key in buckets) buckets[key] += 1;
  }
  const last7Days = Object.entries(buckets).map(([date, count]) => ({ date, count }));

  // Resolve assignee userIds → names in one go.
  const assigneeIds = leadsByAssignee.map((r) => r.assignedTo).filter((id): id is number => id !== null);
  const users = assigneeIds.length
    ? await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  const byAssignee = leadsByAssignee
    .map((r) => ({
      userId: r.assignedTo as number,
      name: nameById.get(r.assignedTo as number) ?? "(unknown)",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    leads: {
      total: leadTotal,
      byStatus,
      unassigned: leadUnassigned,
      byAssignee,
    },
    calls: {
      total: Object.values(byOutcome).reduce((a, b) => a + b, 0),
      byOutcome,
      last7Days,
    },
    followUps: {
      dueToday: followUpsDueToday,
      overdue: followUpsOverdue,
      pending: followUpsPending,
    },
    whatsapp: {
      sentToday: whatsappSentToday,
      receivedToday: whatsappReceivedToday,
    },
    puku: {
      byStatus: pukuByStatus,
    },
  };
}
