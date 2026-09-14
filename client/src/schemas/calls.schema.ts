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

// Input shape — used for the form. The string-typed durationSec matches <input type="number">.
export const logCallSchema = z.object({
  outcome: z.enum(CALL_OUTCOMES),
  durationSec: z.string().optional(),
  notes: z.string().max(5000).optional().or(z.literal("")),
  courseIds: z.array(z.string().min(1)).max(50),
});
export type LogCallValues = z.infer<typeof logCallSchema>;

export function cleanCallPayload(values: LogCallValues) {
  const dur =
    values.durationSec && values.durationSec.trim() !== ""
      ? Number(values.durationSec)
      : undefined;
  return {
    outcome: values.outcome,
    durationSec: Number.isFinite(dur) ? (dur as number) : null,
    notes: values.notes === "" ? undefined : values.notes,
    courseIds: values.courseIds,
  };
}
