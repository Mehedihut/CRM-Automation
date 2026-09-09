import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../services/auth";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage(): JSX.Element {
  const { user, loading, login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch {
      // error is already surfaced via AuthProvider's context
    } finally {
      setSubmitting(false);
    }
  }

  const displayError = localError ?? error;

  return (
    <main className="page">
      <header className="page-header">
        <h1>Sign in</h1>
      </header>
      <section className="card" style={{ maxWidth: 420 }}>
        <form className="form" onSubmit={(e) => void onSubmit(e)}>
          <ErrorBanner message={displayError} onDismiss={() => setLocalError(null)} />
          <FormField
            label="Email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="page-actions" style={{ justifyContent: "flex-end" }}>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
