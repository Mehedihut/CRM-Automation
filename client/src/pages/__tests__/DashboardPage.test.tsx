import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ApiClientErrorStub } from "../../__tests__/apiErrorStub";
import type { DashboardStats } from "../../types/dashboard";

// DashboardPage imports `ApiClientError` from services/api for its describeError helper.
// Point it at our test stub so instanceof checks match the rejected values from the mock.
const mockGetDashboardStats = vi.fn();
const mockGetHealth = vi.fn();
vi.mock("../../services/api", () => ({
  api: {
    getDashboardStats: (...args: unknown[]) => mockGetDashboardStats(...args),
    getHealth: (...args: unknown[]) => mockGetHealth(...args),
  },
  ApiClientError: ApiClientErrorStub,
}));

import { DashboardPage } from "../DashboardPage";

function fullStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    leads: {
      total: 12,
      unassigned: 3,
      byStatus: {
        NEW: 4,
        CONTACTED: 2,
        INTERESTED: 1,
        NOT_INTERESTED: 1,
        UNREACHABLE: 1,
        CONVERTED: 3,
      },
      byAssignee: [
        { userId: 1, name: "Ada", count: 5 },
        { userId: 2, name: "Bob", count: 4 },
      ],
    },
    calls: {
      total: 9,
      byOutcome: {
        CONTACTED: 3,
        INTERESTED: 1,
        NOT_INTERESTED: 1,
        UNREACHABLE: 1,
        CONVERTED: 2,
        FOLLOW_UP_SCHEDULED: 1,
      },
      last7Days: [
        { date: "2026-09-16", count: 1 },
        { date: "2026-09-17", count: 0 },
        { date: "2026-09-18", count: 2 },
        { date: "2026-09-19", count: 0 },
        { date: "2026-09-20", count: 3 },
        { date: "2026-09-21", count: 1 },
        { date: "2026-09-22", count: 2 },
      ],
    },
    followUps: { pending: 5, overdue: 2, dueToday: 1 },
    whatsapp: { sentToday: 4, receivedToday: 2 },
    puku: { byStatus: { PENDING: 3, APPROVED: 7, REJECTED: 1 } },
    ...overrides,
  };
}

function renderDashboard(): void {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

// Read the .stat-value sibling of the given label, so the same digit can't be confused
// across multiple cards or the SVG bar chart.
function readStatValue(labelText: string | RegExp): string {
  const labelEl = screen.getByText(labelText, { selector: ".stat-label" });
  const card = labelEl.closest(".stat-card");
  if (!card) throw new Error(`No .stat-card ancestor for label: ${String(labelText)}`);
  const valueEl = card.querySelector(".stat-value");
  return valueEl?.textContent ?? "";
}

describe("<DashboardPage />", () => {
  beforeEach(() => {
    mockGetDashboardStats.mockReset();
    mockGetHealth.mockReset();
    // HealthBadge is mounted in the header — give it a healthy response so its own
    // loading/error state doesn't bleed into the dashboard assertions.
    mockGetHealth.mockResolvedValue({
      status: "ok",
      environment: "test",
      database: { reachable: true, configured: true },
    });
  });

  it("renders a loading state until stats arrive", () => {
    mockGetDashboardStats.mockReturnValueOnce(new Promise(() => undefined));
    renderDashboard();
    expect(screen.getByText(/^Loading…$/)).toBeInTheDocument();
  });

  it("renders the four top-level stat cards with the supplied totals", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(fullStats());
    renderDashboard();

    expect(await screen.findByText("Total leads")).toBeInTheDocument();
    expect(readStatValue("Total leads")).toBe("12");

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(readStatValue("Unassigned")).toBe("3");

    expect(screen.getByText("Total calls")).toBeInTheDocument();
    expect(readStatValue("Total calls")).toBe("9");
    // last7Days sum = 9 → rendered in the hint line.
    expect(screen.getByText(/9 in last 7 days/)).toBeInTheDocument();

    expect(screen.getByText("Follow-ups pending")).toBeInTheDocument();
    expect(screen.getByText(/2 overdue/)).toBeInTheDocument();
  });

  it("renders the follow-ups hint based on dueToday precedence when not overdue", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(
      fullStats({ followUps: { pending: 2, overdue: 0, dueToday: 1 } }),
    );
    renderDashboard();
    expect(await screen.findByText(/1 due today/)).toBeInTheDocument();
  });

  it("shows the 'all caught up' follow-up hint when nothing is pending", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(
      fullStats({ followUps: { pending: 0, overdue: 0, dueToday: 0 } }),
    );
    renderDashboard();
    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument();
  });

  it("lists every lead status with its count", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(fullStats());
    renderDashboard();

    const card = (await screen.findByText("Leads by status")).closest("section")!;
    for (const status of [
      "NEW",
      "CONTACTED",
      "INTERESTED",
      "NOT_INTERESTED",
      "UNREACHABLE",
      "CONVERTED",
    ] as const) {
      expect(within(card).getByText(status)).toBeInTheDocument();
    }
    // The value cells mirror byStatus in LEAD_STATUS_ORDER. Pull them directly from the
    // DOM since RTL's `within(...)` helper doesn't expose a className matcher.
    const listValues = Array.from(card.querySelectorAll(".stat-list-value"));
    expect(listValues.map((n) => n.textContent)).toEqual(["4", "2", "1", "1", "1", "3"]);
  });

  it("renders the empty state when there are no leads", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(
      fullStats({
        leads: {
          total: 0,
          unassigned: 0,
          byStatus: {
            NEW: 0,
            CONTACTED: 0,
            INTERESTED: 0,
            NOT_INTERESTED: 0,
            UNREACHABLE: 0,
            CONVERTED: 0,
          },
          byAssignee: [],
        },
      }),
    );
    renderDashboard();
    expect(await screen.findByText(/No leads yet\./)).toBeInTheDocument();
  });

  it("renders the last-7-days bar chart with one <rect> per day", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(fullStats());
    renderDashboard();

    const chart = await screen.findByRole("img", { name: /Calls per day/i });
    expect(chart).toBeInTheDocument();
    expect(chart.querySelectorAll("rect").length).toBe(7);
  });

  it("hides the 'By outcome' details block when there are zero calls", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(
      fullStats({
        calls: {
          total: 0,
          byOutcome: {
            CONTACTED: 0,
            INTERESTED: 0,
            NOT_INTERESTED: 0,
            UNREACHABLE: 0,
            CONVERTED: 0,
            FOLLOW_UP_SCHEDULED: 0,
          },
          last7Days: [
            { date: "2026-09-16", count: 0 },
            { date: "2026-09-17", count: 0 },
            { date: "2026-09-18", count: 0 },
            { date: "2026-09-19", count: 0 },
            { date: "2026-09-20", count: 0 },
            { date: "2026-09-21", count: 0 },
            { date: "2026-09-22", count: 0 },
          ],
        },
      }),
    );
    renderDashboard();

    expect(await screen.findByText(/Calls \(last 7 days\)/)).toBeInTheDocument();
    expect(screen.queryByText(/By outcome \(/)).not.toBeInTheDocument();
  });

  it("renders the secondary stat row (whatsapp / follow-ups due today / puku)", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(fullStats());
    renderDashboard();

    // Each numeric read is scoped to its own .stat-card via readStatValue.
    expect(await screen.findByText("WhatsApp sent today")).toBeInTheDocument();
    expect(readStatValue("WhatsApp sent today")).toBe("4");

    expect(screen.getByText("WhatsApp received today")).toBeInTheDocument();
    expect(readStatValue("WhatsApp received today")).toBe("2");

    expect(screen.getByText("Follow-ups due today")).toBeInTheDocument();
    expect(readStatValue("Follow-ups due today")).toBe("1");

    expect(screen.getByText("Puku pending")).toBeInTheDocument();
    expect(readStatValue("Puku pending")).toBe("3");
    // The hint shows the decided counts (APPROVED · REJECTED), interpunct U+00B7.
    const pukuCard = screen.getByText("Puku pending", { selector: ".stat-label" }).closest(".stat-card")!;
    const hint = pukuCard.querySelector(".stat-hint");
    expect(hint?.textContent?.replace(/\s+/g, " ")).toBe("7 approved · 1 rejected");
  });

  it("shows 'none scheduled' hint when nothing is due today", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(
      fullStats({ followUps: { pending: 0, overdue: 0, dueToday: 0 } }),
    );
    renderDashboard();
    expect(await screen.findByText(/none scheduled/)).toBeInTheDocument();
  });

  it("renders the 'Leads by agent' table when there are assignees", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(fullStats());
    renderDashboard();

    const heading = await screen.findByText("Leads by agent");
    const card = heading.closest("section")!;
    const table = within(card).getByRole("table");
    expect(within(table).getByText("Ada")).toBeInTheDocument();
    expect(within(table).getByText("Bob")).toBeInTheDocument();
    expect(within(table).getByText("5")).toBeInTheDocument();
    expect(within(table).getByText("4")).toBeInTheDocument();
  });

  it("hides the 'Leads by agent' card when there are no assignees", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(
      fullStats({ leads: { ...fullStats().leads, byAssignee: [] } }),
    );
    renderDashboard();
    await screen.findByText("Leads by status");
    expect(screen.queryByText("Leads by agent")).not.toBeInTheDocument();
  });

  it("renders the 'Puku requests by status' collapsible section", async () => {
    mockGetDashboardStats.mockResolvedValueOnce(fullStats());
    renderDashboard();

    const summary = await screen.findByText(/Puku requests by status/);
    expect(summary).toBeInTheDocument();
    const details = summary.closest("details")!;
    expect(within(details).getByText("PENDING")).toBeInTheDocument();
    expect(within(details).getByText("APPROVED")).toBeInTheDocument();
    expect(within(details).getByText("REJECTED")).toBeInTheDocument();
  });

  it("surfaces an api error via ErrorBanner", async () => {
    mockGetDashboardStats.mockRejectedValueOnce(
      new ApiClientErrorStub(500, "INTERNAL_ERROR", "boom"),
    );
    renderDashboard();
    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("INTERNAL_ERROR");
    expect(banner).toHaveTextContent("boom");
  });

  it("dismisses the error banner via its close button", async () => {
    mockGetDashboardStats.mockRejectedValueOnce(
      new ApiClientErrorStub(500, "INTERNAL_ERROR", "boom"),
    );
    renderDashboard();
    const banner = await screen.findByRole("alert");
    expect(banner).toBeInTheDocument();

    const close = within(banner).getByRole("button", { name: /×/ });
    close.click();

    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });
});
