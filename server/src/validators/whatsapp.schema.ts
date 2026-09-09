import { z } from "zod";
import { validate } from "../middleware/validate";
import { idParamSchema } from "./team.schema";

export const WHATSAPP_DIRECTIONS = ["INBOUND", "OUTBOUND"] as const;

export const createWhatsAppMessageSchema = z.object({
  direction: z.enum(WHATSAPP_DIRECTIONS),
  body: z.string().min(1).max(4000),
});

export type CreateWhatsAppMessageInput = z.infer<typeof createWhatsAppMessageSchema>;

export const validateCreateWhatsApp = validate({
  body: createWhatsAppMessageSchema,
  params: idParamSchema,
});
export const validateLeadIdParam = validate({ params: idParamSchema });
