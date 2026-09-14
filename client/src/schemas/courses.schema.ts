import { z } from "zod";

// Form input — fields can be optional so react-hook-form can hold partial state.
export const courseFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  isActive: z.boolean(),
});
export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const setLeadInterestsSchema = z.object({
  courseIds: z.array(z.string().min(1)).max(50),
});
export type SetLeadInterestsValues = z.infer<typeof setLeadInterestsSchema>;

export function cleanCoursePayload(values: CourseFormValues) {
  return {
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    isActive: values.isActive,
  };
}
