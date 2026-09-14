import { z } from "zod";

export const PUKU_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const requestPukuSchema = z.object({
  reason: z.string().max(5000).optional().nullable(),
});
export type RequestPukuInput = z.infer<typeof requestPukuSchema>;

export const decidePukuSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(5000).optional().nullable(),
});
export type DecidePukuInput = z.infer<typeof decidePukuSchema>;

export const listPukuQuerySchema = z.object({
  status: z.enum(PUKU_STATUSES).optional(),
});
export type ListPukuQuery = z.infer<typeof listPukuQuerySchema>;
