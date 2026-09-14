import { z } from "zod";

export const FOLLOWUP_STATUSES = ["PENDING", "DONE", "CANCELLED"] as const;

export const scheduleFollowUpSchema = z.object({
  scheduledFor: z.string().datetime({ message: "Invalid date" }),
  note: z.string().max(5000).optional().nullable(),
});
export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>;

export const updateFollowUpSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
  status: z.enum(FOLLOWUP_STATUSES).optional(),
  note: z.string().max(5000).optional().nullable(),
});
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;

export const listFollowUpsQuerySchema = z.object({
  status: z.enum(FOLLOWUP_STATUSES).optional(),
  assignedToMe: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
});
export type ListFollowUpsQuery = z.infer<typeof listFollowUpsQuerySchema>;
