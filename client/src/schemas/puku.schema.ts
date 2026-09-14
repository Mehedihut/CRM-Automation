import { z } from "zod";

export const requestPukuSchema = z.object({
  reason: z.string().max(5000).optional().or(z.literal("")),
});
export type RequestPukuValues = z.infer<typeof requestPukuSchema>;

export const decidePukuSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(5000).optional().or(z.literal("")),
});
export type DecidePukuValues = z.infer<typeof decidePukuSchema>;

export function cleanRequestPuku(values: RequestPukuValues) {
  return {
    reason: values.reason === "" ? undefined : values.reason,
  };
}
