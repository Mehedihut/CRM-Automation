import { z } from "zod";

export const leadStatusEnum = z.enum([
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "FOLLOW_UP",
  "CONVERTED",
  "LOST",
]);

export const createLeadSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required").max(50),
  company: z.string().max(200).optional().or(z.literal("")),
  source: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  status: leadStatusEnum.optional(),
  assignedToId: z.string().optional().nullable(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial();
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const assignLeadSchema = z.object({
  assignedToId: z.string().nullable(),
});
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;

export const listLeadsQuerySchema = z.object({
  status: leadStatusEnum.optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  courseId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
