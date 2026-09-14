/**
 * Centralized runtime config for the client.
 * Reads values from Vite's import.meta.env (only VITE_* vars are exposed).
 *
 * - Default is `/api` (relative) so the Nginx-in-Docker setup (port 8080)
 *   proxies to the backend transparently.
 * - Set VITE_API_BASE_URL=http://localhost:4000 in dev to point straight
 *   at the Express server.
 */
export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api",
} as const;
