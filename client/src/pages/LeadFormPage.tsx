import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  cleanLeadPayload,
  leadFormSchema,
  LEAD_STATUSES,
  type LeadFormValues,
} from "../schemas/leads.schema";
import { FormField } from "../components/FormField";
import { useCreateLead, useLead, useUpdateLead } from "../hooks/useLeads";
import { ApiClientError } from "../services/api";
import { useAuthStore } from "../lib/auth";

export function LeadFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingLead } = useLead(isEdit ? id : undefined);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      company: "",
      source: "",
      notes: "",
      status: "NEW",
      assignedToId: null,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        fullName: existing.fullName,
        phone: existing.phone,
        email: existing.email ?? "",
        company: existing.company ?? "",
        source: existing.source ?? "",
        notes: existing.notes ?? "",
        status: existing.status,
        assignedToId: existing.assignedToId,
      });
    }
  }, [existing, reset]);

  // Only admins can create/edit per backend rules.
  if (role !== "ADMIN") {
    return (
      <main className="page">
        <div className="card">
          <h2>Not authorized</h2>
          <p>Only admins can create or edit leads.</p>
        </div>
      </main>
    );
  }

  if (isEdit && loadingLead) {
    return (
      <main className="page">
        <div className="card">Loading…</div>
      </main>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = cleanLeadPayload(values);
      if (isEdit && id) {
        await updateLead.mutateAsync({ id, body: payload });
      } else {
        await createLead.mutateAsync(payload);
      }
      navigate("/leads");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError("root", { message: err.message });
      } else {
        setError("root", { message: "Failed to save lead" });
      }
    }
  });

  return (
    <main className="page">
      <header className="page-header">
        <h1>{isEdit ? "Edit Lead" : "New Lead"}</h1>
      </header>
      <div className="card">
        <form className="form" onSubmit={onSubmit} noValidate>
          <div className="form-grid">
            <FormField label="Full name *" htmlFor="fullName" error={errors.fullName?.message}>
              <input id="fullName" {...register("fullName")} />
            </FormField>
            <FormField label="Phone *" htmlFor="phone" error={errors.phone?.message}>
              <input id="phone" {...register("phone")} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <input id="email" type="email" {...register("email")} />
            </FormField>
            <FormField label="Company" htmlFor="company" error={errors.company?.message}>
              <input id="company" {...register("company")} />
            </FormField>
            <FormField label="Source" htmlFor="source" error={errors.source?.message}>
              <input id="source" {...register("source")} placeholder="e.g. Facebook, Referral" />
            </FormField>
            <FormField label="Status" htmlFor="status" error={errors.status?.message}>
              <select id="status" {...register("status")}>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <textarea id="notes" rows={4} {...register("notes")} />
          </FormField>
          {errors.root?.message && <div className="error">{errors.root.message}</div>}
          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => navigate("/leads")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create lead"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
