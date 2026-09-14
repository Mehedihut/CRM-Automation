import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../lib/auth";
import type { Role } from "../types/domain";

interface Props {
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ role, children, fallback }: Props) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <>{fallback ?? <NotAuthorized />}</>;
  }
  return <>{children}</>;
}

function NotAuthorized() {
  return (
    <main className="page">
      <div className="card">
        <h2>Not authorized</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    </main>
  );
}
