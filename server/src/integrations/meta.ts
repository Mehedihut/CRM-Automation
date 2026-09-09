import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

/**
 * INTEGRATION TODO — Meta/Facebook Lead Ads webhook ingestion.
 *
 * When META_VERIFY_TOKEN and META_APP_SECRET are configured, this function
 * will be called from `POST /api/integrations/meta/leads` (webhook handler,
 * not yet wired) with the parsed lead payload. It should:
 *   - verify the HMAC signature against META_APP_SECRET
 *   - upsert a Lead row
 *   - log the ingestion
 *
 * For now it throws 501 so callers see a clear "not implemented" code.
 */
export async function metaIngestLead(payload: unknown): Promise<never> {
  void payload;
  void env.meta;
  throw new ApiError(
    501,
    "META_INTEGRATION_PENDING",
    "Meta lead ingestion is not wired yet. Add the webhook handler in routes/integrations.ts.",
  );
}
