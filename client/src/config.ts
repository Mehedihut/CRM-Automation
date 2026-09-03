/**
 * Centralized runtime config for the client.
 * Reads values from Vite's import.meta.env (only VITE_* vars are exposed).
 */
export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000",
} as const;
