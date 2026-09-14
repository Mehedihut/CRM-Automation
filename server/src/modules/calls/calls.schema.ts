import { z } from "zod";

export const CALL_OUTCOMES = [
  "CONNECTED",
  "NO_ANSWER",
  "VOICEMAIL",
  "BAD_NUMBER",
  "NOT_INTERESTED",
  "INTERESTED",
  "FOLLOW_UP_SCHEDULED",
] as const;

export const logCallSchema = z.object({
  outcome: z.enum(CALL_OUTCOMES),
  durationSec: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  calledAt: z.string().datetime().optional(),
  // When the outcome is INTERESTED, the caller may attach one or more courses
  // the customer is interested in. These are persisted as LeadCourseInterest rows
  // (and only persisted when outcome === INTERESTED).
  courseIds: z.array(z.string().min(1)).max(50).optional().default([]),
});
export type LogCallInput = z.infer<typeof logCallSchema>;
