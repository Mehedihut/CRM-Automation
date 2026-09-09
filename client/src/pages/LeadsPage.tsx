import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../services/api";
import type { CreateLeadInput, Lead } from "../types/leads";
import type { TeamMember } from "../types/team";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";
import { Modal } from "../components/Modal";

interface CreateFormState {
  name: string;
  phone: string;
  email: string;
  source: string;
  notes: string;
}

const emptyCreate: CreateFormState = {
  name: "",
  phone: "",
  email: "",
  source: "",
  notes: "",
};

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function LeadsPage(): JSX.Element {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateFormState>(emptyCreate);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [l, t] = await Promise.all([api.listLeads(), api.listTeam()]);
      setLeads(l);
      setTeam(t);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onAssign(leadId: number, userId: number | null): Promise<void> {
    setError(null);
    const previous = leads;
    // Optimistic update
    setLeads((curr) =>
      curr.map((l) =>
        l.id === leadId
          ? {
              ...l,
              assignedTo: userId,
              assignee:
                userId === null
                  ? null
                  : (() => {
                      const m = team.find((t) => t.id === userId);
                      return m ? { id: m.id, name: m.name, email: m.email } : null;
                    })(),
            }
          : l,
      ),
    );
    try {
      const updated = await api.assignLead(leadId, userId);
      setLeads((curr) => curr.map((l) => (l.id === leadId ? updated : l)));
    } catch (err) {
      setLeads(previous);
      setError(describeError(err));
    }
  }

  async function onDelete(lead: Lead): Promise<void> {
    if (!window.confirm(`Delete lead "${lead.name}"?`)) return;
    setError(null);
    try {
      await api.deleteLead(lead.id);
      setLeads((curr) => curr.filter((l) => l.id !== lead.id));
    } catch (err) {
      setError(describeError(err));
    }
  }

  function openCreate(): void {
    setForm(emptyCreate);
    setFormError(null);
    setCreating(true);
  }

  async function submitCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError("Name and phone are required.");
      return;
    }
    const input: CreateLeadInput = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      source: form.source.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    setSubmitting(true);
    try {
      await api.createLead(input);
      setCreating(false);
      await refresh();
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Leads</h1>
        <div className="page-actions">
          <Button variant="primary" onClick={openCreate}>
            New lead
          </Button>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <section className="card">
        {loading ? (
          <p>Loading…</p>
        ) : leads.length === 0 ? (
          <p className="table-empty">No leads yet. Click "New lead" to add one.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    {lead.name}
                    {lead.email ? (
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{lead.email}</div>
                    ) : null}
                  </td>
                  <td>{lead.phone}</td>
                  <td>
                    <span className="badge badge-pending">{lead.status}</span>
                  </td>
                  <td>
                    <select
                      value={lead.assignee?.id ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        void onAssign(lead.id, v === "" ? null : Number(v));
                      }}
                    >
                      <option value="">Unassigned</option>
                      {team.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{lead.source ?? "—"}</td>
                  <td>
                    <div className="page-actions">
                      <Link to={`/leads/${lead.id}`}>
                        <Button>View</Button>
                      </Link>
                      <Button variant="danger" onClick={() => void onDelete(lead)}>
                        Delete
                      </Button>
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
          title="New lead"
          onClose={() => setCreating(false)}
          footer={
            <>
              <Button onClick={() => setCreating(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={(e) => void submitCreate(e as unknown as React.FormEvent)}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Create"}
              </Button>
            </>
          }
        >
          <form className="form" onSubmit={(e) => void submitCreate(e)}>
            {formError && (
              <div className="error-banner">
                <span>{formError}</span>
              </div>
            )}
            <FormField
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <FormField
              label="Phone"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <FormField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <FormField
              label="Source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
            <FormField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            {/* Hidden submit so Enter inside an input triggers the form's onSubmit. */}
            <button type="submit" style={{ display: "none" }} aria-hidden="true" />
          </form>
        </Modal>
      )}
    </main>
  );
}
