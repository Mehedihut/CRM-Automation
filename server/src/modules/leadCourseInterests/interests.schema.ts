import { z } from "zod";

export const setLeadInterestsSchema = z.object({
  courseIds: z.array(z.string().min(1)).max(50),
});
export type SetLeadInterestsInput = z.infer<typeof setLeadInterestsSchema>;
