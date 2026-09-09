import { z } from "zod";
import { LeadStatus } from "@prisma/client";
import { validate } from "../middleware/validate";
import { idParamSchema } from "./team.schema";

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "NOT_INTERESTED",
  "UNREACHABLE",
  "CONVERTED",
] as const;

export const createLeadSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(3).max(40),
  email: z.string().email().max(200).optional(),
  source: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(3).max(40).optional(),
  email: z.string().email().max(200).nullable().optional(),
  source: z.string().max(80).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  // Direct status writes are allowed for admins via the dashboard tooling;
  // normal status changes go through POST /api/leads/:id/calls.
  status: z.nativeEnum(LeadStatus).optional(),
});

export const listLeadsQuerySchema = z.object({
  assigneeId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

export const validateCreateLead = validate({ body: createLeadSchema });
export const validateUpdateLead = validate({
  body: updateLeadSchema,
  params: idParamSchema,
});
export const validateListLeads = validate({ query: listLeadsQuerySchema });
export const validateLeadIdParam = validate({ params: idParamSchema });
