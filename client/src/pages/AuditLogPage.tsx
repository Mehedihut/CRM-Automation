import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "../services/api";
import type {
  AuditAction,
  AuditLogEntry,
  ListAuditQuery,
} from "../types/audit";
import { AUDIT_ACTIONS } from "../types/audit";
import { ErrorBanner } from "../components/ErrorBanner";
import { Button } from "../components/Button";

const PAGE_LIMIT = 50;

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

function metadataToString(meta: Record<string, unknown> | null): string {
  if (!meta || Object.keys(meta).length === 0) return "—";
  try {
    return JSON.stringify(meta);
  } catch {
    return "(unserializable)";
  }
}

function entityLabel(entity: string | null): string {
  if (!entity) return "—";
  const [kind, id] = entity.split(":");
  if (!id) return entity;
  if (kind === "lead") return `Lead #${id}`;
  if (kind === "puku_request") return `Puku request #${id}`;
  return `${kind} #${id}`;
}

function actionBadgeClass(action: AuditAction): string {
  switch (action) {
    case "AUTH_LOGIN_FAILURE":
      return "badge-rejected";
    case "AUTH_LOGIN_SUCCESS":
    case "AUTH_PASSWORD_RESET_COMPLETED":
    case "AUTH_LOGOUT":
      return "badge-ok";
    case "AUTH_PASSWORD_RESET_REQUESTED":
      return "badge-pending";
    default:
      return "badge-pending";
  }
}

export function AuditLogPage(): JSX.Element {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const [action, setAction] = useState<AuditAction | "">("");
  const [entity, setEntity] = useState<string>("");
  const [actorId, setActorId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const buildQuery = useCallback(
    (cursor?: number): ListAuditQuery => {
      const q: ListAuditQuery = { limit: PAGE_LIMIT };
      if (action) q.action = action;
      if (entity.trim()) q.entity = entity.trim();
      if (actorId && Number(actorId) > 0) q.actorId = Number(actorId);
      if (from) q.from = new Date(from).toISOString();
      if (to) q.to = new Date(to).toISOString();
      if (cursor) q.cursor = cursor;
      return q;
    },
    [action, entity, actorId, from, to],
  );

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listAuditLog(buildQuery());
      setItems(res.items);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function loadMore(): Promise<void> {
    if (!nextCursor) return;
    setLoading(true);
    try {
      const res = await api.listAuditLog(buildQuery(nextCursor));
      setItems((curr) => [...curr, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  function resetFilters(): void {
    setAction("");
    setEntity("");
    setActorId("");
    setFrom("");
    setTo("");
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Audit log</h1>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="form" style={{ flexDirection: "row", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-field">
            <label htmlFor="audit-action">Action</label>
            <select
              id="audit-action"
              value={action}
              onChange={(e) => setAction(e.target.value as AuditAction | "")}
            >
              <option value="">Any</option>
              {AUDIT_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="audit-entity">Entity</label>
            <input
              id="audit-entity"
              type="text"
              placeholder="e.g. lead:7"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="audit-actor">Actor ID</label>
            <input
              id="audit-actor"
              type="number"
              min={1}
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="audit-from">From</label>
            <input
              id="audit-from"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="audit-to">To</label>
            <input
              id="audit-to"
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="page-actions">
            <Button onClick={resetFilters}>Reset</Button>
          </div>
        </div>
      </section>

      <section className="card">
        {loading && items.length === 0 ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p className="table-empty">No audit entries match the filter.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>IP</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${actionBadgeClass(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td>{entityLabel(entry.entity)}</td>
                  <td>
                    {entry.actor ? (
                      <>
                        <div>{entry.actor.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{entry.actor.email}</div>
                      </>
                    ) : (
                      <span style={{ color: "#6b7280" }}>anonymous</span>
                    )}
                  </td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                    {entry.ip ?? "—"}
                  </td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, maxWidth: 360 }}>
                    <span title={metadataToString(entry.metadata)}>
                      {metadataToString(entry.metadata)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {nextCursor && (
          <div className="page-actions" style={{ marginTop: 16, justifyContent: "center" }}>
            <Button onClick={() => void loadMore()} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
