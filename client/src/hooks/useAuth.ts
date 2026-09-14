import { useCallback } from "react";
import { api, ApiClientError } from "../services/api";
import { useAuthStore, type AuthUser } from "../lib/auth";
import type { User } from "../types/domain";

interface LoginResponse {
  user: AuthUser;
  token: string;
}

interface MeResponse {
  user: User;
}

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => Boolean(s.token));
  const loginStore = useAuthStore((s) => s.login);
  const logoutStore = useAuthStore((s) => s.logout);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const res = await api.post<LoginResponse>("/api/auth/login", { email, password });
        loginStore(res.user, res.token);
      } catch (err) {
        if (err instanceof ApiClientError) throw err;
        throw err;
      }
    },
    [loginStore],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      logoutStore();
    }
  }, [logoutStore]);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get<MeResponse>("/api/auth/me");
      loginStore(
        { id: res.user.id, email: res.user.email, name: res.user.name, role: res.user.role },
        useAuthStore.getState().token ?? "",
      );
    } catch {
      logoutStore();
    }
  }, [loginStore, logoutStore]);

  return { user, token, isAuthenticated, login, logout, refresh };
}
