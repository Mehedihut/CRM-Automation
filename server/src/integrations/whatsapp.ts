import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

/**
 * INTEGRATION TODO — WhatsApp Business API outbound send.
 *
 * When WHATSAPP_API_TOKEN + WHATSAPP_PHONE_ID are configured, this function
 * should POST to https://graph.facebook.com/v18.0/{phone_id}/messages and
 * store the returned `messages[0].id` on the WhatsAppMessage row
 * (externalId). For now it throws 501.
 */
export async function whatsappSendMessage(_args: {
  to: string;
  body: string;
}): Promise<never> {
  void env.whatsapp;
  throw new ApiError(
    501,
    "WHATSAPP_INTEGRATION_PENDING",
    "WhatsApp outbound send is not wired yet. Add the API client in integrations/whatsapp.ts.",
  );
}

/**
 * INTEGRATION TODO — verify a webhook challenge from Meta.
 * Future webhook handler: POST /api/integrations/whatsapp/webhook
 */
export function whatsappVerifyWebhook(_args: {
  mode: string;
  token: string;
  challenge: string;
}): { challenge: string } | null {
  return null;
}
