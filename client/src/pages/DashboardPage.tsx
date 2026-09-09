import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "../services/api";
import type {
  CallOutcomeKey,
  DashboardStats,
  LeadStatusKey,
  PukuStatusKey,
} from "../types/dashboard";
import { HealthBadge } from "../components/HealthBadge";
import { ErrorBanner } from "../components/ErrorBanner";
import { StatusBadge } from "../components/StatusBadge";

const LEAD_STATUS_ORDER: LeadStatusKey[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "NOT_INTERESTED",
  "UNREACHABLE",
  "CONVERTED",
];

const CALL_OUTCOME_ORDER: CallOutcomeKey[] = [
  "CONTACTED",
  "INTERESTED",
  "NOT_INTERESTED",
  "UNREACHABLE",
  "CONVERTED",
  "FOLLOW_UP_SCHEDULED",
];

const PUKU_STATUS_ORDER: PukuStatusKey[] = ["PENDING", "APPROVED", "REJECTED"];

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

function StatCard(props: { label: string; value: number | string; hint?: string }): JSX.Element {
  return (
    <div className="stat-card">
      <div className="stat-label">{props.label}</div>
      <div className="stat-value">{props.value}</div>
      {props.hint && <div className="stat-hint">{props.hint}</div>}
    </div>
  );
}

function BarChart(props: { data: { label: string; value: number }[] }): JSX.Element {
  const max = Math.max(1, ...props.data.map((d) => d.value));
  const barWidth = 32;
  const barGap = 12;
  const chartHeight = 140;
  const width = props.data.length * (barWidth + barGap);
  return (
    <svg
      viewBox={`0 0 ${width} ${chartHeight + 30}`}
      width="100%"
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label="Calls per day"
    >
      {props.data.map((d, i) => {
        const h = (d.value / max) * chartHeight;
        const x = i * (barWidth + barGap);
        const y = chartHeight - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth} height={h} rx={4} fill="#2563eb" />
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="11"
              fill="#1f2937"
            >
              {d.value}
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight + 16}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function formatDay(iso: string): string {
  // iso is YYYY-MM-DD; show MM/DD for compactness.
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function DashboardPage(): JSX.Element {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(describeError(err));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <HealthBadge />
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {!stats ? (
        <section className="card">
          <p>Loading…</p>
        </section>
      ) : (
        <>
          <section className="stats-grid">
            <StatCard label="Total leads" value={stats.leads.total} />
            <StatCard
              label="Unassigned"
              value={stats.leads.unassigned}
              hint="Leads with no agent yet"
            />
            <StatCard
              label="Total calls"
              value={stats.calls.total}
              hint={`${stats.calls.last7Days.reduce((acc, d) => acc + d.count, 0)} in last 7 days`}
            />
            <StatCard
              label="Follow-ups pending"
              value={stats.followUps.pending}
              hint={
                stats.followUps.overdue > 0
                  ? `${stats.followUps.overdue} overdue`
                  : stats.followUps.dueToday > 0
                  ? `${stats.followUps.dueToday} due today`
                  : "all caught up"
              }
            />
          </section>

          <section className="card" style={{ marginTop: 16 }}>
            <h2>Leads by status</h2>
            {stats.leads.total === 0 ? (
              <p className="table-empty">No leads yet.</p>
            ) : (
              <ul className="stat-list">
                {LEAD_STATUS_ORDER.map((s) => (
                  <li key={s}>
                    <span className="stat-list-label">
                      <StatusBadge status={s} />
                    </span>
                    <span className="stat-list-value">{stats.leads.byStatus[s] ?? 0}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" style={{ marginTop: 16 }}>
            <h2>Calls (last 7 days)</h2>
            <BarChart
              data={stats.calls.last7Days.map((d) => ({
                label: formatDay(d.date),
                value: d.count,
              }))}
            />
            {stats.calls.total > 0 && (
              <details style={{ marginTop: 16 }}>
                <summary style={{ cursor: "pointer", color: "#374151" }}>
                  By outcome ({stats.calls.total} total)
                </summary>
                <ul className="stat-list" style={{ marginTop: 8 }}>
                  {CALL_OUTCOME_ORDER.map((o) => (
                    <li key={o}>
                      <span className="stat-list-label">{o}</span>
                      <span className="stat-list-value">{stats.calls.byOutcome[o] ?? 0}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section className="stats-grid" style={{ marginTop: 16 }}>
            <StatCard label="WhatsApp sent today" value={stats.whatsapp.sentToday} />
            <StatCard label="WhatsApp received today" value={stats.whatsapp.receivedToday} />
            <StatCard
              label="Follow-ups due today"
              value={stats.followUps.dueToday}
              hint={stats.followUps.dueToday === 0 ? "none scheduled" : "see Follow-ups page"}
            />
            <StatCard
              label="Puku pending"
              value={stats.puku.byStatus.PENDING}
              hint={`${stats.puku.byStatus.APPROVED} approved · ${stats.puku.byStatus.REJECTED} rejected`}
            />
          </section>

          {stats.leads.byAssignee.length > 0 && (
            <section className="card" style={{ marginTop: 16 }}>
              <h2>Leads by agent</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.leads.byAssignee.map((a) => (
                    <tr key={a.userId}>
                      <td>{a.name}</td>
                      <td>{a.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <details className="card" style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Puku requests by status</summary>
            <ul className="stat-list" style={{ marginTop: 8 }}>
              {PUKU_STATUS_ORDER.map((s) => (
                <li key={s}>
                  <span className="stat-list-label">
                    <StatusBadge status={s} />
                  </span>
                  <span className="stat-list-value">{stats.puku.byStatus[s] ?? 0}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </main>
  );
}
