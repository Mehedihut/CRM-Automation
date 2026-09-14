import { z } from "zod";

export const createTeamMemberSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required").max(200),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "AGENT"]),
});
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

export const updateTeamMemberSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
  active: z.boolean().optional(),
});
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
