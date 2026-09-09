import type { User } from "../types/auth";
import type { AuthContextValue } from "../services/auth";

/** Defaults to logged-out; override fields per test. */
export function makeAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    loading: false,
    error: null,
    login: async () => undefined,
    logout: async () => undefined,
    refresh: async () => undefined,
    ...overrides,
  };
}

export const adminUser: User = {
  id: 1,
  name: "Ada",
  email: "ada@example.com",
  role: "ADMIN",
};

export const agentUser: User = {
  id: 2,
  name: "Bob",
  email: "bob@example.com",
  role: "AGENT",
};