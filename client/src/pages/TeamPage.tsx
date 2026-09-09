import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "../services/api";
import type { CreateTeamMemberInput, TeamMember, UpdateTeamMemberInput } from "../types/team";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";
import { Modal } from "../components/Modal";

interface FormState {
  name: string;
  email: string;
}

const emptyForm: FormState = { name: "", email: "" };

interface EditingState {
  member: TeamMember | null;
  form: FormState;
}

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function TeamPage(): JSX.Element {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listTeam();
      setMembers(list);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openCreate(): void {
    setEditing({ member: null, form: emptyForm });
    setFormError(null);
  }

  function openEdit(member: TeamMember): void {
    setEditing({ member, form: { name: member.name, email: member.email } });
    setFormError(null);
  }

  function closeModal(): void {
    if (!submitting) setEditing(null);
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);
    const name = editing.form.name.trim();
    const email = editing.form.email.trim();
    if (!name || !email) {
      setFormError("Name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      if (editing.member) {
        const input: UpdateTeamMemberInput = { name, email };
        await api.updateTeamMember(editing.member.id, input);
      } else {
        const input: CreateTeamMemberInput = { name, email };
        await api.createTeamMember(input);
      }
      setEditing(null);
      await refresh();
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(member: TeamMember): Promise<void> {
    if (!window.confirm(`Delete team member "${member.name}"?`)) return;
    setError(null);
    try {
      await api.deleteTeamMember(member.id);
      setMembers((curr) => curr.filter((m) => m.id !== member.id));
    } catch (err) {
      setError(describeError(err));
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Team</h1>
        <div className="page-actions">
          <Button variant="primary" onClick={openCreate}>
            New member
          </Button>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <section className="card">
        {loading ? (
          <p>Loading…</p>
        ) : members.length === 0 ? (
          <p className="table-empty">No team members yet. Click "New member" to add one.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="page-actions">
                      <Button onClick={() => openEdit(m)}>Edit</Button>
                      <Button variant="danger" onClick={() => void onDelete(m)}>
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

      {editing && (
        <Modal
          title={editing.member ? `Edit ${editing.member.name}` : "New team member"}
          onClose={closeModal}
          footer={
            <>
              <Button onClick={closeModal} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={(e) => void submit(e as unknown as React.FormEvent)}
                disabled={submitting}
              >
                {submitting ? "Saving…" : editing.member ? "Save" : "Create"}
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
              label="Name"
              required
              value={editing.form.name}
              onChange={(e) =>
                setEditing({ ...editing, form: { ...editing.form, name: e.target.value } })
              }
            />
            <FormField
              label="Email"
              type="email"
              required
              value={editing.form.email}
              onChange={(e) =>
                setEditing({ ...editing, form: { ...editing.form, email: e.target.value } })
              }
            />
            <button type="submit" style={{ display: "none" }} aria-hidden="true" />
          </form>
        </Modal>
      )}
    </main>
  );
}
