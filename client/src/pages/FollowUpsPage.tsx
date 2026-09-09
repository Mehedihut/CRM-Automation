import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../services/api";
import type {
  FollowUp,
  FollowUpStatus,
  ListFollowUpsQuery,
} from "../types/followups";
import { FOLLOW_UP_STATUSES } from "../types/followups";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { useAuth } from "../services/auth";

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function FollowUpsPage(): JSX.Element {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string>(
    user ? String(user.id) : "",
  );
  const [filterStatus, setFilterStatus] = useState<string>("");

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const query: ListFollowUpsQuery = {};
    if (filterAssignee) query.assigneeId = Number(filterAssignee);
    if (filterStatus) query.status = filterStatus as FollowUpStatus;
    try {
      const data = await api.listFollowUps(query);
      setFollowUps(data);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [filterAssignee, filterStatus]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function changeStatus(fu: FollowUp, status: FollowUpStatus): Promise<void> {
    try {
      const updated = await api.updateFollowUp(fu.id, { status });
      setFollowUps((curr) => curr.map((x) => (x.id === fu.id ? updated : x)));
    } catch (err) {
      setError(describeError(err));
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Follow-ups</h1>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="form" style={{ flexDirection: "row", gap: 16, alignItems: "flex-end" }}>
          <div className="form-field">
            <label htmlFor="fu-filter-assignee">Assignee</label>
            <select
              id="fu-filter-assignee"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="">Anyone</option>
              {user && <option value={String(user.id)}>Me</option>}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="fu-filter-status">Status</label>
            <select
              id="fu-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Any</option>
              {FOLLOW_UP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card">
        {loading ? (
          <p>Loading…</p>
        ) : followUps.length === 0 ? (
          <p className="table-empty">No follow-ups match the filter.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>When</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map((fu) => (
                <tr key={fu.id}>
                  <td>
                    <Link to={`/leads/${fu.leadId}`}>{fu.lead.name}</Link>
                  </td>
                  <td>{new Date(fu.scheduledAt).toLocaleString()}</td>
                  <td>{fu.assignee.name}</td>
                  <td>
                    <select
                      value={fu.status}
                      onChange={(e) => void changeStatus(fu, e.target.value as FollowUpStatus)}
                    >
                      {FOLLOW_UP_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{fu.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
