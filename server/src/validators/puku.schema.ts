import { z } from "zod";
import { validate } from "../middleware/validate";
import { idParamSchema } from "./team.schema";

export const PUKU_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const createPukuRequestSchema = z.object({
  requesterName: z.string().min(1).max(120),
  requesterEmail: z.string().email().max(200).optional(),
  requesterPhone: z.string().min(3).max(40).optional(),
  requestedScope: z.string().min(1).max(200),
  reason: z.string().max(2000).optional(),
});

export const updatePukuRequestSchema = z.object({
  requesterName: z.string().min(1).max(120).optional(),
  requesterEmail: z.string().email().max(200).nullable().optional(),
  requesterPhone: z.string().min(3).max(40).nullable().optional(),
  requestedScope: z.string().min(1).max(200).optional(),
  reason: z.string().max(2000).nullable().optional(),
});

export const decisionSchema = z.object({
  note: z.string().max(2000).optional(),
});

export const listPukuRequestsQuerySchema = z.object({
  status: z.enum(PUKU_STATUSES).optional(),
});

export type CreatePukuRequestInput = z.infer<typeof createPukuRequestSchema>;
export type UpdatePukuRequestInput = z.infer<typeof updatePukuRequestSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
export type ListPukuRequestsQuery = z.infer<typeof listPukuRequestsQuerySchema>;

export const validateCreatePuku = validate({ body: createPukuRequestSchema });
export const validateUpdatePuku = validate({
  body: updatePukuRequestSchema,
  params: idParamSchema,
});
export const validateDecision = validate({
  body: decisionSchema,
  params: idParamSchema,
});
export const validateListPuku = validate({ query: listPukuRequestsQuerySchema });
export const validatePukuIdParam = validate({ params: idParamSchema });
