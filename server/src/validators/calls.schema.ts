import { z } from "zod";
import { validate } from "../middleware/validate";
import { idParamSchema } from "./team.schema";

export const CALL_OUTCOMES = [
  "CONTACTED",
  "INTERESTED",
  "NOT_INTERESTED",
  "UNREACHABLE",
  "CONVERTED",
  "FOLLOW_UP_SCHEDULED",
] as const;

export const createCallSchema = z.object({
  leadId: z.number().int().positive(),
  outcome: z.enum(CALL_OUTCOMES),
  notes: z.string().max(2000).optional(),
  duration: z.number().int().min(0).max(86_400).optional(), // up to 24h
});

export type CreateCallInput = z.infer<typeof createCallSchema>;

export const validateCreateCall = validate({ body: createCallSchema });
export const validateLeadIdParam = validate({ params: idParamSchema });
