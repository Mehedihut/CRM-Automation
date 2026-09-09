import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../services/api";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";

const GENERIC_MESSAGE =
  "If an account exists for that email, a reset link has been sent.";

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      setDone(true);
    } catch (err) {
      // Show the same generic message even on rate-limit, but log the code.
      // eslint-disable-next-line no-console
      console.warn("forgot-password error", describeError(err));
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page" style={{ maxWidth: 420 }}>
      <header className="page-header">
        <h1>Forgot password</h1>
      </header>

      <section className="card">
        {done ? (
          <p>{GENERIC_MESSAGE}</p>
        ) : (
          <form className="form" onSubmit={(e) => void submit(e)}>
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
            <FormField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || email.trim().length === 0}
            >
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
            <button type="submit" style={{ display: "none" }} aria-hidden="true" />
          </form>
        )}
        <p style={{ marginTop: 16, fontSize: 13 }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}
