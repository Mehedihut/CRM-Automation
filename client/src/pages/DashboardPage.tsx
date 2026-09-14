import { Link } from "react-router-dom";
import { useDashboardStats } from "../hooks/useDashboard";
import { HealthBadge } from "../components/HealthBadge";
import { useAuthStore } from "../lib/auth";
import type { LeadStatus } from "../types/domain";

const STATUS_ORDER: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "FOLLOW_UP",
  "CONVERTED",
  "LOST",
];

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useDashboardStats();

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Welcome back{user ? `, ${user.name}` : ""}.</p>
        </div>
        <div className="flex">
          <HealthBadge />
          <button type="button" className="btn btn-sm" onClick={() => refetch()}>
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="error">Failed to load stats: {String(error)}</div>}

      {isLoading || !data ? (
        <div className="card">Loading…</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Total leads" value={data.totals.leads} />
            <StatCard label="Calls logged" value={data.totals.calls} />
            <StatCard label="WhatsApp messages" value={data.totals.whatsapps} />
            <StatCard label="Pending follow-ups" value={data.totals.pendingFollowUps} />
            <StatCard label="Puku requests pending" value={data.totals.pukuPending} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Leads by status</h2>
              <div className="bar-chart">
                {STATUS_ORDER.map((s) => {
                  const count = data.leadsByStatus[s] ?? 0;
                  const max = Math.max(1, ...STATUS_ORDER.map((k) => data.leadsByStatus[k] ?? 0));
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={s} className="bar-row">
                      <span className="bar-label">{prettify(s)}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="bar-value">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginTop: 0 }}>Recent activity</h2>
              {data.recentActivity.length === 0 ? (
                <p className="muted">No activity yet.</p>
              ) : (
                <div className="activity-list">
                  {data.recentActivity.map((a, i) => (
                    <div key={i} className="activity-item">
                      <span>
                        <span className={`badge ${badgeForKind(a.kind)}`}>{a.kind}</span>{" "}
                        {a.leadId ? (
                          <Link to={`/leads/${a.leadId}`}>{a.summary}</Link>
                        ) : (
                          a.summary
                        )}
                      </span>
                      <span className="activity-time">
                        {new Date(a.at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {data.agentPerformance.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h2 style={{ marginTop: 0 }}>Agent performance</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Leads assigned</th>
                      <th>Calls logged</th>
                      <th>Conversions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agentPerformance.map((a) => (
                      <tr key={a.agentId}>
                        <td>{a.name}</td>
                        <td>{a.leadsAssigned}</td>
                        <td>{a.callsLogged}</td>
                        <td>{a.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.courseInterest && data.courseInterest.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h2 style={{ marginTop: 0 }}>Course interest</h2>
              <p className="muted" style={{ marginTop: -4 }}>
                Leads interested in each course, broken down by open follow-ups and conversions.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Interested leads</th>
                      <th>With follow-up</th>
                      <th>Converted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courseInterest.map((c) => (
                      <tr key={c.courseId}>
                        <td>
                          {c.courseName}
                          {!c.isActive && (
                            <span className="muted" style={{ marginLeft: 6, fontSize: 12 }}>
                              (inactive)
                            </span>
                          )}
                        </td>
                        <td>
                          {c.interested > 0 ? (
                            <Link to={`/leads?courseId=${c.courseId}`}>
                              {c.interested}
                            </Link>
                          ) : (
                            <span className="muted">0</span>
                          )}
                        </td>
                        <td>{c.followUps}</td>
                        <td>{c.converted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function prettify(s: string) {
  return s
    .toLowerCase()
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function badgeForKind(kind: string) {
  switch (kind) {
    case "call":
      return "badge-pending";
    case "whatsapp":
      return "badge-ok";
    case "followUp":
      return "badge-warn";
    case "lead":
      return "badge-neutral";
    default:
      return "badge-neutral";
  }
}
