import { z } from "zod";

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "FOLLOW_UP",
  "CONVERTED",
  "LOST",
] as const;

export const leadFormSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200),
  phone: z.string().min(1, "Phone is required").max(50),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
  source: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(LEAD_STATUSES),
  assignedToId: z.string().optional().nullable(),
});
export type LeadFormValues = z.infer<typeof leadFormSchema>;

export function cleanLeadPayload(values: LeadFormValues) {
  const emptyToUndef = (v: string | undefined) =>
    v === undefined || v === "" ? undefined : v;
  return {
    fullName: values.fullName,
    phone: values.phone,
    email: emptyToUndef(values.email),
    company: emptyToUndef(values.company),
    source: emptyToUndef(values.source),
    notes: emptyToUndef(values.notes),
    status: values.status,
    assignedToId: values.assignedToId,
  };
}
