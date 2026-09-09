import { useState } from "react";
import { api, ApiClientError } from "../services/api";
import type { Call, CallOutcome, CreateCallInput } from "../types/calls";
import { CALL_OUTCOMES } from "../types/calls";
import { Button } from "./Button";
import { ErrorBanner } from "./ErrorBanner";
import { FormField } from "./FormField";
import { Modal } from "./Modal";

interface Props {
  leadId: number;
  calls: Call[];
  onChanged: (calls: Call[]) => void;
}

interface FormState {
  outcome: CallOutcome;
  notes: string;
  duration: string; // free-text in the form; coerced on submit
}

const emptyForm: FormState = { outcome: "CONTACTED", notes: "", duration: "" };

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function CallsSection({ leadId, calls, onChanged }: Props): JSX.Element {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    const input: CreateCallInput = {
      leadId,
      outcome: form.outcome,
      notes: form.notes.trim() || undefined,
      duration: form.duration.trim() ? Number(form.duration) : undefined,
    };
    setSubmitting(true);
    try {
      const created = await api.createCall(input);
      onChanged([created, ...calls]);
      setCreating(false);
      setForm(emptyForm);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <header className="page-header" style={{ marginBottom: 12 }}>
        <h2>Calls</h2>
        <div className="page-actions">
          <Button variant="primary" onClick={() => setCreating(true)}>
            Log call
          </Button>
        </div>
      </header>

      {calls.length === 0 ? (
        <p className="table-empty">No calls logged yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Outcome</th>
              <th>Agent</th>
              <th>Notes</th>
              <th>Duration</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="badge badge-pending">{c.outcome}</span>
                </td>
                <td>{c.agent.name}</td>
                <td>{c.notes ?? "—"}</td>
                <td>{c.duration != null ? `${c.duration}s` : "—"}</td>
                <td>{new Date(c.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {creating && (
        <Modal
          title="Log call"
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
                {submitting ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <form className="form" onSubmit={(e) => void submit(e)}>
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
            <div className="form-field">
              <label htmlFor="call-outcome">Outcome</label>
              <select
                id="call-outcome"
                value={form.outcome}
                onChange={(e) =>
                  setForm({ ...form, outcome: e.target.value as CallOutcome })
                }
              >
                {CALL_OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <FormField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <FormField
              label="Duration (seconds)"
              type="number"
              min={0}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
            <button type="submit" style={{ display: "none" }} aria-hidden="true" />
          </form>
        </Modal>
      )}
    </section>
  );
}
