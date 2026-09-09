import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiClientError } from "../services/api";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function ResetPasswordPage(): JSX.Element {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="page" style={{ maxWidth: 420 }}>
        <header className="page-header">
          <h1>Reset password</h1>
        </header>
        <section className="card">
          <p>This reset link is invalid or missing.</p>
          <p style={{ marginTop: 16, fontSize: 13 }}>
            <Link to="/forgot-password">Request a new link</Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page" style={{ maxWidth: 420 }}>
      <header className="page-header">
        <h1>Reset password</h1>
      </header>

      <section className="card">
        {done ? (
          <>
            <p>Your password has been reset.</p>
            <Button variant="primary" onClick={() => navigate("/login")}>
              Go to sign in
            </Button>
          </>
        ) : (
          <form className="form" onSubmit={(e) => void submit(e)}>
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
            <FormField
              label="New password"
              type="password"
              required
              hint="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormField
              label="Confirm new password"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || password.length === 0}
            >
              {submitting ? "Saving…" : "Save new password"}
            </Button>
            <button type="submit" style={{ display: "none" }} aria-hidden="true" />
          </form>
        )}
      </section>
    </main>
  );
}
