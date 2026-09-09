import { ApiError } from "../utils/ApiError";

/**
 * INTEGRATION TODO — Puku API provisioning.
 *
 * When PUKU_API_BASE_URL + PUKU_API_TOKEN are configured, this function
 * should POST to {PUKU_API_BASE_URL}/access-requests with the granted scope.
 * It must be idempotent on retry (use the request id as a client token).
 */
export async function pukuProvisionAccess(_args: {
  requestId: number;
  scope: string;
}): Promise<{ externalRef: string }> {
  throw new ApiError(
    501,
    "PUKU_INTEGRATION_PENDING",
    "Puku provisioning is not wired yet. Add the API client in integrations/puku.ts.",
  );
}
