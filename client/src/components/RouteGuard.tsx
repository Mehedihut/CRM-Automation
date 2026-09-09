import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../services/auth";
import type { UserRole } from "../types/auth";

/**
 * Wrap any route subtree that requires an authed user.
 * If unauthed, redirects to /login (preserving the intended destination).
 */
export function RequireAuth({ children }: { children: ReactNode }): JSX.Element {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingPanel />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

/**
 * Wrap routes that require a specific role (or one of several).
 * Falls back to RequireAuth behaviour for unauthed users, then 403s.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}): JSX.Element {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingPanel />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!roles.includes(user.role)) {
    return (
      <main className="page">
        <section className="card">
          <h2>Forbidden</h2>
          <p>You don't have permission to view this page.</p>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}

function LoadingPanel(): JSX.Element {
  return (
    <main className="page">
      <section className="card">
        <p>Loading…</p>
      </section>
    </main>
  );
}
