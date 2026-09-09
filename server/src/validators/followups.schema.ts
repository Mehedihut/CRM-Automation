import { z } from "zod";
import { validate } from "../middleware/validate";
import { idParamSchema } from "./team.schema";

export const FOLLOW_UP_STATUSES = ["PENDING", "DONE", "MISSED", "CANCELED"] as const;

export const createFollowUpSchema = z.object({
  leadId: z.number().int().positive(),
  assigneeId: z.number().int().positive().optional(), // defaults to current user
  scheduledAt: z.coerce.date(),
  notes: z.string().max(2000).optional(),
});

export const updateFollowUpSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  status: z.enum(FOLLOW_UP_STATUSES).optional(),
  notes: z.string().max(2000).nullable().optional(),
  assigneeId: z.number().int().positive().optional(),
});

export const listFollowUpsQuerySchema = z.object({
  assigneeId: z.coerce.number().int().positive().optional(),
  status: z.enum(FOLLOW_UP_STATUSES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  leadId: z.coerce.number().int().positive().optional(),
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
export type ListFollowUpsQuery = z.infer<typeof listFollowUpsQuerySchema>;

export const validateCreateFollowUp = validate({ body: createFollowUpSchema });
export const validateUpdateFollowUp = validate({
  body: updateFollowUpSchema,
  params: idParamSchema,
});
export const validateListFollowUps = validate({ query: listFollowUpsQuerySchema });
export const validateFollowUpIdParam = validate({ params: idParamSchema });
