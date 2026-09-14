import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../lib/auth";
import { FormField } from "../components/FormField";
import { ApiClientError } from "../services/api";

export function LoginPage() {
  const isAuthed = useAuthStore((s) => Boolean(s.token));
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (isAuthed) {
    return <Navigate to="/leads" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from && from !== "/login" ? from : "/leads", { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
      } else {
        setServerError("Unable to login. Please try again.");
      }
    }
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign in</h1>
        <form className="form" onSubmit={onSubmit} noValidate>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="username"
              {...register("email")}
            />
          </FormField>
          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
          </FormField>
          {serverError && <div className="error">{serverError}</div>}
          <button type="submit" className="btn btn-primary full-width" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="auth-hint">
          <strong>Demo credentials:</strong>
          <br />
          Admin: admin@crm.local / admin123
          <br />
          Agent: agent1@crm.local / agent123
        </div>
      </div>
    </div>
  );
}
