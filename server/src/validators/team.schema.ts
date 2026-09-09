import { z } from "zod";
import { validate } from "../middleware/validate";

// assignLeadSchema lives with the team module because userId is semantically
// a team-member ID.
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createTeamMemberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
});

export const updateTeamMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(200).optional(),
  password: z.string().min(8).max(200).optional(),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
});

export const assignLeadSchema = z.object({
  // null = unassign
  userId: z.number().int().positive().nullable(),
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;

export const validateCreateTeam = validate({ body: createTeamMemberSchema });
export const validateUpdateTeam = validate({
  body: updateTeamMemberSchema,
  params: idParamSchema,
});
export const validateIdParam = validate({ params: idParamSchema });
export const validateAssignLead = validate({
  body: assignLeadSchema,
  params: idParamSchema,
});
