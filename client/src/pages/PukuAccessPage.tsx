import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "../services/api";
import type {
  CreatePukuRequestInput,
  ListPukuRequestsQuery,
  PukuAccessRequest,
  PukuDecisionInput,
  PukuRequestStatus,
} from "../types/puku";
import { PUKU_STATUSES } from "../types/puku";
import { useAuth } from "../services/auth";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";

interface FormState {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  requestedScope: string;
  reason: string;
}

const emptyForm: FormState = {
  requesterName: "",
  requesterEmail: "",
  requesterPhone: "",
  requestedScope: "",
  reason: "",
};

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function PukuAccessPage(): JSX.Element {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [requests, setRequests] = useState<PukuAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PukuRequestStatus | "">("");

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [decisionTarget, setDecisionTarget] = useState<PukuAccessRequest | null>(null);
  const [decisionMode, setDecisionMode] = useState<"approve" | "reject">("approve");
  const [decisionNote, setDecisionNote] = useState<string>("");

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const query: ListPukuRequestsQuery = {};
    if (filterStatus) query.status = filterStatus;
    try {
      const data = await api.listPukuRequests(query);
      setRequests(data);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openCreate(): void {
    setForm(emptyForm);
    setFormError(null);
    setCreating(true);
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(null);
    const requesterName = form.requesterName.trim();
    const requestedScope = form.requestedScope.trim();
    if (!requesterName || !requestedScope) {
      setFormError("Requester name and requested scope are required.");
      return;
    }
    const input: CreatePukuRequestInput = {
      requesterName,
      requestedScope,
    };
    const email = form.requesterEmail.trim();
    const phone = form.requesterPhone.trim();
    const reason = form.reason.trim();
    if (email) input.requesterEmail = email;
    if (phone) input.requesterPhone = phone;
    if (reason) input.reason = reason;
    setSubmitting(true);
    try {
      await api.createPukuRequest(input);
      setCreating(false);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function openDecision(req: PukuAccessRequest, mode: "approve" | "reject"): void {
    setDecisionTarget(req);
    setDecisionMode(mode);
    setDecisionNote("");
  }

  async function submitDecision(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!decisionTarget) return;
    setSubmitting(true);
    try {
      const payload: PukuDecisionInput = {};
      const trimmed = decisionNote.trim();
      if (trimmed) payload.note = trimmed;
      if (decisionMode === "approve") {
        await api.approvePukuRequest(decisionTarget.id, payload);
      } else {
        await api.rejectPukuRequest(decisionTarget.id, payload);
      }
      setDecisionTarget(null);
      setDecisionNote("");
      await refresh();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(req: PukuAccessRequest): Promise<void> {
    if (!window.confirm(`Delete Puku request from "${req.requesterName}"?`)) return;
    setError(null);
    try {
      await api.deletePukuRequest(req.id);
      setRequests((curr) => curr.filter((r) => r.id !== req.id));
    } catch (err) {
      setError(describeError(err));
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Puku access requests</h1>
        <div className="page-actions">
          <Button variant="primary" onClick={openCreate}>
            New request
          </Button>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="form" style={{ flexDirection: "row", gap: 16, alignItems: "flex-end" }}>
          <div className="form-field">
            <label htmlFor="puku-filter-status">Status</label>
            <select
              id="puku-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PukuRequestStatus | "")}
            >
              <option value="">All</option>
              {PUKU_STATUSES.map((s) => (
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
        ) : requests.length === 0 ? (
          <p className="table-empty">No Puku access requests yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Scope</th>
                <th>Status</th>
                <th>Decided by</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div>{r.requesterName}</div>
                    {(r.requesterEmail || r.requesterPhone) && (
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {[r.requesterEmail, r.requesterPhone].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{r.requestedScope}</div>
                    {r.reason && (
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{r.reason}</div>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                    {r.decisionNote && (
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                        Note: {r.decisionNote}
                      </div>
                    )}
                  </td>
                  <td>
                    {r.decidedBy ? (
                      <>
                        <div>{r.decidedBy.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {r.decidedAt ? new Date(r.decidedAt).toLocaleString() : ""}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="page-actions">
                      {isAdmin && r.status === "PENDING" && (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => openDecision(r, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => openDecision(r, "reject")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {isAdmin && (
                        <Button variant="danger" onClick={() => void onDelete(r)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {creating && (
        <Modal
          title="New Puku access request"
          onClose={() => {
            if (!submitting) setCreating(false);
          }}
          footer={
            <>
              <Button onClick={() => setCreating(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={(e) => void submit(e as unknown as React.FormEvent)}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Submit"}
              </Button>
            </>
          }
        >
          <form className="form" onSubmit={(e) => void submit(e)}>
            {formError && (
              <div className="error-banner">
                <span>{formError}</span>
              </div>
            )}
            <FormField
              label="Requester name"
              required
              value={form.requesterName}
              onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
            />
            <FormField
              label="Requester email"
              type="email"
              value={form.requesterEmail}
              onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
            />
            <FormField
              label="Requester phone"
              value={form.requesterPhone}
              onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
            />
            <FormField
              label="Requested scope"
              required
              hint='e.g. "Read-only", "Admin", "Agent: <name>"'
              value={form.requestedScope}
              onChange={(e) => setForm({ ...form, requestedScope: e.target.value })}
            />
            <div className="form-field">
              <label htmlFor="puku-reason">Reason</label>
              <textarea
                id="puku-reason"
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <button type="submit" style={{ display: "none" }} aria-hidden="true" />
          </form>
        </Modal>
      )}

      {decisionTarget && (
        <Modal
          title={decisionMode === "approve" ? "Approve request" : "Reject request"}
          onClose={() => {
            if (!submitting) {
              setDecisionTarget(null);
              setDecisionNote("");
            }
          }}
          footer={
            <>
              <Button
                onClick={() => {
                  setDecisionTarget(null);
                  setDecisionNote("");
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant={decisionMode === "approve" ? "primary" : "danger"}
                onClick={(e) => void submitDecision(e as unknown as React.FormEvent)}
                disabled={submitting}
              >
                {submitting
                  ? "Saving…"
                  : decisionMode === "approve"
                  ? "Approve"
                  : "Reject"}
              </Button>
            </>
          }
        >
          <form className="form" onSubmit={(e) => void submitDecision(e)}>
            <p style={{ margin: 0, color: "#374151" }}>
              <strong>{decisionTarget.requesterName}</strong> — {decisionTarget.requestedScope}
            </p>
            <div className="form-field">
              <label htmlFor="puku-decision-note">Note (optional)</label>
              <textarea
                id="puku-decision-note"
                rows={3}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
              />
            </div>
            {decisionMode === "approve" && (
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                Approving will call the Puku provisioning integration (currently stubbed — expect a
                501 "PUKU_INTEGRATION_PENDING" until the real API client is wired up).
              </p>
            )}
            <button type="submit" style={{ display: "none" }} aria-hidden="true" />
          </form>
        </Modal>
      )}
    </main>
  );
}
