import { useState } from "react";
import { api, ApiClientError } from "../services/api";
import type {
  CreateFollowUpInput,
  FollowUp,
  FollowUpStatus,
} from "../types/followups";
import { FOLLOW_UP_STATUSES } from "../types/followups";
import { Button } from "./Button";
import { ErrorBanner } from "./ErrorBanner";
import { FormField } from "./FormField";
import { Modal } from "./Modal";

interface Props {
  leadId: number;
  followUps: FollowUp[];
  onChanged: (followUps: FollowUp[]) => void;
}

interface FormState {
  scheduledAt: string; // datetime-local string
  notes: string;
}

function defaultScheduledAt(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // +1h
  d.setSeconds(0, 0);
  // Format for datetime-local: YYYY-MM-DDTHH:mm
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm: FormState = { scheduledAt: defaultScheduledAt(), notes: "" };

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function FollowUpsSection({ leadId, followUps, onChanged }: Props): JSX.Element {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    const scheduledAtIso = new Date(form.scheduledAt).toISOString();
    if (!form.scheduledAt || Number.isNaN(Date.parse(form.scheduledAt))) {
      setError("Please pick a valid date/time.");
      return;
    }
    const input: CreateFollowUpInput = {
      leadId,
      scheduledAt: scheduledAtIso,
      notes: form.notes.trim() || undefined,
    };
    setSubmitting(true);
    try {
      const created = await api.createFollowUp(input);
      onChanged([created, ...followUps]);
      setCreating(false);
      setForm({ ...emptyForm, scheduledAt: defaultScheduledAt() });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(fu: FollowUp, status: FollowUpStatus): Promise<void> {
    try {
      const updated = await api.updateFollowUp(fu.id, { status });
      onChanged(followUps.map((x) => (x.id === fu.id ? updated : x)));
    } catch (err) {
      setError(describeError(err));
    }
  }

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <header className="page-header" style={{ marginBottom: 12 }}>
        <h2>Follow-ups</h2>
        <div className="page-actions">
          <Button variant="primary" onClick={() => setCreating(true)}>
            Schedule
          </Button>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {followUps.length === 0 ? (
        <p className="table-empty">No follow-ups scheduled.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {followUps.map((fu) => (
              <tr key={fu.id}>
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
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {creating && (
        <Modal
          title="Schedule follow-up"
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
            <FormField
              label="Scheduled at"
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
            <FormField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <button type="submit" style={{ display: "none" }} aria-hidden="true" />
          </form>
        </Modal>
      )}
    </section>
  );
}
