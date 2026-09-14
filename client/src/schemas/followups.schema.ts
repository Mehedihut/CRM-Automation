import { z } from "zod";

export const FOLLOWUP_STATUSES = ["PENDING", "DONE", "CANCELLED"] as const;

export const scheduleFollowUpSchema = z.object({
  scheduledFor: z.string().min(1, "Date is required"),
  note: z.string().max(5000).optional().or(z.literal("")),
});
export type ScheduleFollowUpValues = z.infer<typeof scheduleFollowUpSchema>;

export const updateFollowUpSchema = z.object({
  status: z.enum(FOLLOWUP_STATUSES).optional(),
  scheduledFor: z.string().optional(),
  note: z.string().max(5000).optional().or(z.literal("")),
});
export type UpdateFollowUpValues = z.infer<typeof updateFollowUpSchema>;

export function cleanFollowUpPayload(values: ScheduleFollowUpValues) {
  // Convert datetime-local string to ISO.
  const d = new Date(values.scheduledFor);
  const iso = Number.isNaN(d.getTime()) ? values.scheduledFor : d.toISOString();
  return {
    scheduledFor: iso,
    note: values.note === "" ? undefined : values.note,
  };
}

export function cleanFollowUpUpdatePayload(values: UpdateFollowUpValues) {
  const out: { status?: string; scheduledFor?: string; note?: string } = {};
  if (values.status) out.status = values.status;
  if (values.scheduledFor) {
    const d = new Date(values.scheduledFor);
    out.scheduledFor = Number.isNaN(d.getTime())
      ? values.scheduledFor
      : d.toISOString();
  }
  if (values.note !== undefined) {
    out.note = values.note === "" ? "" : values.note;
  }
  return out;
}
