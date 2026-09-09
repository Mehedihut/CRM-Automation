import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  CallOutcome,
  FollowUpStatus,
  LeadStatus,
  PukuRequestStatus,
  WhatsAppDirection,
} from "@prisma/client";
import { getDashboardStats } from "../dashboard.service";
import { createMockPrisma, asPrisma, type MockPrisma } from "../../__tests__/createMockPrisma";

/**
 * The dashboard service runs all 12 queries via Promise.all and buckets
 * calls into "today" relative to `new Date()`. Every test below uses a
 * fixed reference "now" so the date-bucketing assertions stay deterministic
 * regardless of when the test runs.
 *
 * Reference date: 2026-03-15T14:30:00.000Z (a Sunday, so the 7 buckets
 * stretch 2026-03-09 → 2026-03-15 inclusive, oldest → newest).
 */
const NOW = new Date("2026-03-15T14:30:00.000Z");

function utcDaysAgo(n: number): Date {
  const d = new Date(Date.UTC(2026, 2, 15)); // 2026-03-15 UTC midnight
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

// Fake timers leak across suites without an explicit reset.
afterEach(() => {
  vi.useRealTimers();
});

/**
 * Build a `createMockPrisma` with every dashboard query pre-stubbed to its
 * zero / empty result. Individual tests override the methods they exercise.
 */
function emptyPrisma(): MockPrisma {
  const prisma = createMockPrisma();
  // counts
  prisma.lead.count.mockResolvedValue(0);
  prisma.followUp.count.mockResolvedValue(0);
  prisma.whatsAppMessage.count.mockResolvedValue(0);
  // groupBys
  prisma.lead.groupBy.mockResolvedValue([]);
  prisma.call.groupBy.mockResolvedValue([]);
  prisma.pukuAccessRequest.groupBy.mockResolvedValue([]);
  // call findMany for last-7-days bucketing
  prisma.call.findMany.mockResolvedValue([]);
  // name resolution
  prisma.user.findMany.mockResolvedValue([]);
  return prisma;
}

describe("dashboard.service.getDashboardStats", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = emptyPrisma();
  });

  it("returns a fully zeroed, well-shaped baseline on an empty DB", async () => {
    const stats = await getDashboardStats(asPrisma(prisma));

    expect(stats.leads.total).toBe(0);
    expect(stats.leads.unassigned).toBe(0);
    expect(stats.leads.byStatus).toEqual({
      NEW: 0,
      CONTACTED: 0,
      INTERESTED: 0,
      NOT_INTERESTED: 0,
      UNREACHABLE: 0,
      CONVERTED: 0,
    });
    expect(stats.leads.byAssignee).toEqual([]);

    expect(stats.calls.total).toBe(0);
    expect(stats.calls.byOutcome).toEqual({
      CONTACTED: 0,
      INTERESTED: 0,
      NOT_INTERESTED: 0,
      UNREACHABLE: 0,
      CONVERTED: 0,
      FOLLOW_UP_SCHEDULED: 0,
    });

    expect(stats.calls.last7Days).toHaveLength(7);
    expect(stats.calls.last7Days.map((b) => b.date)).toEqual([
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
    expect(stats.calls.last7Days.every((b) => b.count === 0)).toBe(true);

    expect(stats.followUps).toEqual({ dueToday: 0, overdue: 0, pending: 0 });
    expect(stats.whatsapp).toEqual({ sentToday: 0, receivedToday: 0 });
    expect(stats.puku.byStatus).toEqual({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
  });

  it("merges lead groupBy rows into byStatus (only known statuses are set)", async () => {
    prisma.lead.count.mockResolvedValue(10);
    prisma.lead.groupBy.mockResolvedValue([
      { status: LeadStatus.NEW, _count: { _all: 3 } },
      { status: LeadStatus.CONVERTED, _count: { _all: 2 } },
    ]);

    const stats = await getDashboardStats(asPrisma(prisma));

    expect(stats.leads.byStatus.NEW).toBe(3);
    expect(stats.leads.byStatus.CONVERTED).toBe(2);
    expect(stats.leads.byStatus.CONTACTED).toBe(0); // zero-filled
  });

  it("counts leads with assignedTo=null separately from the status group", async () => {
    prisma.lead.count.mockImplementation(async (args: any) => {
      if (args?.where?.assignedTo === null) return 4;
      return 12;
    });
    prisma.lead.groupBy.mockResolvedValue([
      { status: LeadStatus.NEW, _count: { _all: 8 } },
    ]);

    const stats = await getDashboardStats(asPrisma(prisma));

    expect(stats.leads.total).toBe(12);
    expect(stats.leads.unassigned).toBe(4);
  });

  it("merges call groupBy rows into byOutcome and totals the buckets", async () => {
    prisma.call.groupBy.mockResolvedValue([
      { outcome: CallOutcome.CONTACTED, _count: { _all: 4 } },
      { outcome: CallOutcome.CONVERTED, _count: { _all: 1 } },
    ]);

    const stats = await getDashboardStats(asPrisma(prisma));

    expect(stats.calls.byOutcome.CONTACTED).toBe(4);
    expect(stats.calls.byOutcome.CONVERTED).toBe(1);
    expect(stats.calls.total).toBe(5);
  });

  it("buckets calls into the last-7-days slots (oldest → newest, today included)", async () => {
    prisma.call.findMany.mockResolvedValue([
      { createdAt: utcDaysAgo(0) },
      { createdAt: utcDaysAgo(0) },
      { createdAt: utcDaysAgo(3) },
      { createdAt: utcDaysAgo(6) },
      // an old call outside the window — must be ignored
      { createdAt: utcDaysAgo(30) },
    ]);

    const stats = await getDashboardStats(asPrisma(prisma));

    expect(stats.calls.last7Days).toEqual([
      { date: "2026-03-09", count: 1 }, // 6 days ago
      { date: "2026-03-10", count: 0 },
      { date: "2026-03-11", count: 0 },
      { date: "2026-03-12", count: 1 }, // 3 days ago
      { date: "2026-03-13", count: 0 },
      { date: "2026-03-14", count: 0 },
      { date: "2026-03-15", count: 2 }, // today
    ]);
  });

  it("uses three distinct follow-up counts (dueToday / overdue / pending)", async () => {
    prisma.followUp.count.mockImplementation(async (args: any) => {
      const where = args?.where ?? {};
      if (where.status === FollowUpStatus.PENDING && where.scheduledAt?.gte) return 3; // dueToday
      if (where.status === FollowUpStatus.PENDING && where.scheduledAt?.lt && !where.scheduledAt?.gte) return 5; // overdue
      if (where.status === FollowUpStatus.PENDING && !where.scheduledAt) return 11; // all pending
      return 0;
    });

    const stats = await getDashboardStats(asPrisma(prisma));

    expect(stats.followUps).toEqual({ dueToday: 3, overdue: 5, pending: 11 });
  });

  it("splits WhatsApp counts by direction (OUTBOUND = sent, INBOUND = received)", async () => {
    prisma.whatsAppMessage.count.mockImplementation(async (args: any) => {
      if (args?.where?.direction === WhatsAppDirection.OUTBOUND) return 7;
      if (args?.where?.direction === WhatsAppDirection.INBOUND) return 4;
      return 0;
    });

    const stats = await getDashboardStats(asPrisma(prisma));

    expect(stats.whatsapp).toEqual({ sentToday: 7, receivedToday: 4 });
  });

  it("merges Puku groupBy rows into puku.byStatus", async () => {
    prisma.pukuAccessRequest.groupBy.mockResolvedValue([
      { status: PukuRequestStatus.PENDING, _count: { _all: 2 } },
    ]);

    const stats = await getDashboardStats(asPrisma(prisma));

    expect(stats.puku.byStatus.PENDING).toBe(2);
    expect(stats.puku.byStatus.APPROVED).toBe(0);
    expect(stats.puku.byStatus.REJECTED).toBe(0);
  });

  it("resolves assignee userIds to names and sorts by count descending", async () => {
    prisma.lead.groupBy.mockImplementation(async (args: any) => {
      if (args?.by?.includes("assignedTo")) {
        return [
          { assignedTo: 10, _count: { _all: 3 } },
          { assignedTo: 20, _count: { _all: 7 } },
          { assignedTo: 30, _count: { _all: 1 } },
        ];
      }
      return [];
    });
    prisma.user.findMany.mockResolvedValue([
      { id: 10, name: "Ada" },
      { id: 20, name: "Bob" },
      { id: 30, name: "Cleo" },
    ]);

    const stats = await getDashboardStats(asPrisma(prisma));

    expect(stats.leads.byAssignee).toEqual([
      { userId: 20, name: "Bob", count: 7 },
      { userId: 10, name: "Ada", count: 3 },
      { userId: 30, name: "Cleo", count: 1 },
    ]);
  });

  it("falls back to '(unknown)' for assignees whose users have been deleted", async () => {
    prisma.lead.groupBy.mockImplementation(async (args: any) => {
      if (args?.by?.includes("assignedTo")) {
        return [
          { assignedTo: 10, _count: { _all: 2 } },
          { assignedTo: 99, _count: { _all: 1 } }, // user deleted
        ];
      }
      return [];
    });
    prisma.user.findMany.mockResolvedValue([{ id: 10, name: "Ada" }]);

    const stats = await getDashboardStats(asPrisma(prisma));

    const ada = stats.leads.byAssignee.find((r) => r.userId === 10);
    const ghost = stats.leads.byAssignee.find((r) => r.userId === 99);
    expect(ada).toEqual({ userId: 10, name: "Ada", count: 2 });
    expect(ghost).toEqual({ userId: 99, name: "(unknown)", count: 1 });
  });

  it("skips the user.findMany call entirely when no assignees exist", async () => {
    prisma.lead.groupBy.mockResolvedValue([]);
    prisma.user.findMany.mockClear();

    await getDashboardStats(asPrisma(prisma));

    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
