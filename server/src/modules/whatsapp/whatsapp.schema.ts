import { z } from "zod";

export const logWhatsappSchema = z.object({
  direction: z.enum(["OUTBOUND", "INBOUND"]),
  body: z.string().min(1, "Message is required").max(5000),
  sentAt: z.string().datetime().optional(),
});
export type LogWhatsappInput = z.infer<typeof logWhatsappSchema>;
