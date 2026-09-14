import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../lib/auth";

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const isAuthed = useAuthStore((s) => Boolean(s.token));
  const location = useLocation();
  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
