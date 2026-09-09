import { useState } from "react";
import { api, ApiClientError } from "../services/api";
import type {
  CreateWhatsAppInput,
  WhatsAppDirection,
  WhatsAppMessage,
} from "../types/whatsapp";
import { WHATSAPP_DIRECTIONS } from "../types/whatsapp";
import { Button } from "./Button";
import { ErrorBanner } from "./ErrorBanner";
import { Modal } from "./Modal";

interface Props {
  leadId: number;
  messages: WhatsAppMessage[];
  onChanged: (messages: WhatsAppMessage[]) => void;
}

interface FormState {
  direction: WhatsAppDirection;
  body: string;
}

const emptyForm: FormState = { direction: "OUTBOUND", body: "" };

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function WhatsAppSection({ leadId, messages, onChanged }: Props): JSX.Element {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    const input: CreateWhatsAppInput = {
      direction: form.direction,
      body: form.body.trim(),
    };
    if (!input.body) {
      setError("Message body is required.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createWhatsApp(leadId, input);
      onChanged([created, ...messages]);
      setCreating(false);
      setForm(emptyForm);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <header className="page-header" style={{ marginBottom: 12 }}>
        <h2>WhatsApp</h2>
        <div className="page-actions">
          <Button variant="primary" onClick={() => setCreating(true)}>
            New message
          </Button>
        </div>
      </header>

      {messages.length === 0 ? (
        <p className="table-empty">No WhatsApp messages yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Direction</th>
              <th>Sender</th>
              <th>Body</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td>
                  <span
                    className={
                      m.direction === "INBOUND" ? "badge badge-ok" : "badge badge-pending"
                    }
                  >
                    {m.direction}
                  </span>
                </td>
                <td>{m.sender?.name ?? "—"}</td>
                <td style={{ maxWidth: 480, whiteSpace: "pre-wrap" }}>{m.body}</td>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {creating && (
        <Modal
          title="New WhatsApp message"
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
              <label htmlFor="wa-dir">Direction</label>
              <select
                id="wa-dir"
                value={form.direction}
                onChange={(e) =>
                  setForm({ ...form, direction: e.target.value as WhatsAppDirection })
                }
              >
                {WHATSAPP_DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="wa-body">Body</label>
              <textarea
                id="wa-body"
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <button type="submit" style={{ display: "none" }} aria-hidden="true" />
          </form>
        </Modal>
      )}
    </section>
  );
}
