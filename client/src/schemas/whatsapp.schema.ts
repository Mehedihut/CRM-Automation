import { z } from "zod";

export const logWhatsappSchema = z.object({
  direction: z.enum(["OUTBOUND", "INBOUND"]),
  body: z.string().min(1, "Message is required").max(5000),
});
export type LogWhatsappValues = z.infer<typeof logWhatsappSchema>;

export function cleanWhatsappPayload(values: LogWhatsappValues) {
  return values;
}
