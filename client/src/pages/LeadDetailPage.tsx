import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAssignLead, useDeleteLead, useLead, useSetLeadInterests } from "../hooks/useLeads";
import { useAgents } from "../hooks/useTeam";
import { useCallsByLead, useDeleteCall, useLogCall } from "../hooks/useCalls";
import {
  useDeleteWhatsapp,
  useLogWhatsapp,
  useWhatsappByLead,
} from "../hooks/useWhatsapp";
import {
  useDeleteFollowUp,
  useFollowUps,
  useScheduleFollowUp,
  useUpdateFollowUp,
} from "../hooks/useFollowUps";
import {
  usePukuByLead,
  useRequestPuku,
} from "../hooks/usePuku";
import { useActiveCourses } from "../hooks/useCourses";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";
import { DataTable, type Column } from "../components/DataTable";
import { MultiSelect } from "../components/MultiSelect";
import { useAuthStore } from "../lib/auth";
import { ApiClientError } from "../services/api";
import {
  CALL_OUTCOMES,
  cleanCallPayload,
  logCallSchema,
  type LogCallValues,
} from "../schemas/calls.schema";
import {
  cleanWhatsappPayload,
  logWhatsappSchema,
  type LogWhatsappValues,
} from "../schemas/whatsapp.schema";
import {
  cleanFollowUpPayload,
  scheduleFollowUpSchema,
  type ScheduleFollowUpValues,
} from "../schemas/followups.schema";
import {
  cleanRequestPuku,
  requestPukuSchema,
  type RequestPukuValues,
} from "../schemas/puku.schema";
import type {
  Call,
  Course,
  FollowUp,
  Lead,
  PukuAccessRequest,
  WhatsappMessage,
} from "../types/domain";

type Tab = "info" | "courses" | "calls" | "whatsapp" | "followups" | "puku";

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const { data: lead, isLoading, error } = useLead(id);
  const assignLead = useAssignLead();
  const deleteLead = useDeleteLead();
  const [tab, setTab] = useState<Tab>("info");

  if (isLoading) {
    return (
      <main className="page">
        <div className="card">Loading…</div>
      </main>
    );
  }
  if (error || !lead) {
    return (
      <main className="page">
        <div className="card">
          <h2>Lead not found</h2>
          <p>
            <Link to="/leads">← Back to leads</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>{lead.fullName}</h1>
          <div className="flex">
            <StatusBadge status={lead.status} />
            <span className="muted">· {lead.phone}</span>
          </div>
        </div>
        {role === "ADMIN" && (
          <div className="flex">
            <button
              type="button"
              className="btn"
              onClick={() => navigate(`/leads/${lead.id}/edit`)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(`Delete lead "${lead.fullName}"?`)) {
                  deleteLead.mutate(lead.id, {
                    onSuccess: () => navigate("/leads"),
                  });
                }
              }}
            >
              Delete
            </button>
          </div>
        )}
      </header>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === "info" ? "active" : ""}`}
          onClick={() => setTab("info")}
        >
          Info
        </button>
        <button
          type="button"
          className={`tab ${tab === "courses" ? "active" : ""}`}
          onClick={() => setTab("courses")}
        >
          Courses
          {lead.courseInterests?.length > 0 && (
            <span className="tab-count">{lead.courseInterests.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`tab ${tab === "calls" ? "active" : ""}`}
          onClick={() => setTab("calls")}
        >
          Calls
        </button>
        <button
          type="button"
          className={`tab ${tab === "whatsapp" ? "active" : ""}`}
          onClick={() => setTab("whatsapp")}
        >
          WhatsApp
        </button>
        <button
          type="button"
          className={`tab ${tab === "followups" ? "active" : ""}`}
          onClick={() => setTab("followups")}
        >
          Follow-ups
        </button>
        <button
          type="button"
          className={`tab ${tab === "puku" ? "active" : ""}`}
          onClick={() => setTab("puku")}
        >
          Puku Access
        </button>
      </div>

      {tab === "info" && (
        <InfoTab
          lead={lead}
          onAssign={(agentId) => assignLead.mutate({ id: lead.id, agentId })}
        />
      )}
      {tab === "courses" && <CoursesTab lead={lead} />}
      {tab === "calls" && <CallsTab leadId={lead.id} />}
      {tab === "whatsapp" && <WhatsappTab leadId={lead.id} />}
      {tab === "followups" && <FollowUpsTab leadId={lead.id} />}
      {tab === "puku" && <PukuTab leadId={lead.id} />}
    </main>
  );
}

function InfoTab({ lead, onAssign }: { lead: Lead; onAssign: (agentId: string | null) => void }) {
  const role = useAuthStore((s) => s.user?.role);
  const { data: agents } = useAgents();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string>(lead.assignedToId ?? "");

  return (
    <div className="card">
      <h2>Lead information</h2>
      <InfoRow label="Phone" value={lead.phone} />
      <InfoRow label="Email" value={lead.email ?? "—"} />
      <InfoRow label="Company" value={lead.company ?? "—"} />
      <InfoRow label="Source" value={lead.source ?? "—"} />
      <InfoRow label="Status" value={lead.status} />
      <InfoRow label="Created" value={new Date(lead.createdAt).toLocaleString()} />
      <InfoRow label="Updated" value={new Date(lead.updatedAt).toLocaleString()} />
      {lead.notes && (
        <div style={{ marginTop: 16 }}>
          <strong>Notes</strong>
          <p style={{ whiteSpace: "pre-wrap", margin: "4px 0 0 0" }}>{lead.notes}</p>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Assignment</h3>
        {editing ? (
          <div className="flex">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                minWidth: 200,
              }}
            >
              <option value="">Unassigned</option>
              {(agents?.items ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onAssign(selected || null);
                setEditing(false);
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setSelected(lead.assignedToId ?? "");
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex">
            <span>{lead.assignedTo?.name ?? "Unassigned"}</span>
            {role === "ADMIN" && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setEditing(true)}
              >
                {lead.assignedToId ? "Change" : "Assign"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        padding: "6px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <span className="muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CallsTab({ leadId }: { leadId: string }) {
  const { data, isLoading } = useCallsByLead(leadId);
  const deleteCall = useDeleteCall(leadId);
  const [open, setOpen] = useState(false);

  const columns: Column<Call>[] = [
    {
      key: "outcome",
      header: "Outcome",
      render: (r) => <StatusBadge status={r.outcome} />,
    },
    {
      key: "agent",
      header: "By",
      render: (r) => r.agent.name,
    },
    {
      key: "duration",
      header: "Duration",
      render: (r) => (r.durationSec != null ? `${r.durationSec}s` : "—"),
    },
    {
      key: "calledAt",
      header: "When",
      render: (r) => new Date(r.calledAt).toLocaleString(),
    },
    {
      key: "notes",
      header: "Notes",
      render: (r) => r.notes ?? <span className="muted">—</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            if (confirm("Delete this call?")) deleteCall.mutate(r.id);
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="card">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>Call history</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
          + Log call
        </button>
      </div>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(r) => r.id}
        loading={isLoading}
        emptyMessage="No calls logged yet"
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Log call">
        <LogCallForm
          leadId={leadId}
          onSuccess={() => setOpen(false)}
          onSubmit={async (values) => {
            await useLogCall(leadId).mutateAsync(cleanCallPayload(values));
          }}
        />
      </Modal>
    </div>
  );
}

function LogCallForm({
  onSuccess,
  onSubmit,
  leadId,
}: {
  onSuccess: () => void;
  onSubmit: (values: LogCallValues) => Promise<void>;
  leadId: string;
}) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LogCallValues>({
    resolver: zodResolver(logCallSchema),
    defaultValues: { outcome: "CONNECTED", durationSec: "", notes: "", courseIds: [] },
  });
  const { data: coursesData } = useActiveCourses();
  const courses: Course[] = coursesData?.items ?? [];
  const outcome = watch("outcome");
  const courseIds = watch("courseIds") ?? [];

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset({ outcome: "CONNECTED", durationSec: "", notes: "", courseIds: [] });
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError("root", { message: err.message });
      } else {
        setError("root", { message: "Failed to log call" });
      }
    }
  });

  return (
    <form className="form" onSubmit={submit} noValidate>
      <FormField label="Outcome" htmlFor="outcome" error={errors.outcome?.message}>
        <select id="outcome" {...register("outcome")}>
          {CALL_OUTCOMES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Duration (seconds)" htmlFor="durationSec" error={errors.durationSec?.message}>
        <input id="durationSec" type="number" min={0} {...register("durationSec")} />
      </FormField>
      <FormField label="Notes" htmlFor="notes" error={errors.notes?.message}>
        <textarea id="notes" rows={3} {...register("notes")} />
      </FormField>
      <FormField
        label="Next interested course"
        htmlFor={`courseIds-${leadId}`}
        error={errors.courseIds?.message}
        hint={
          outcome === "INTERESTED"
            ? "Recommended when the customer is interested."
            : "Optional — only saved when outcome is Interested."
        }
      >
        <MultiSelect
          id={`courseIds-${leadId}`}
          options={courses.map((c) => ({ id: c.id, label: c.name }))}
          value={courseIds}
          onChange={(ids) =>
            setValue("courseIds", ids, { shouldDirty: true, shouldValidate: true })
          }
          placeholder="Search courses…"
          emptyMessage={
            courses.length === 0
              ? "No active courses — ask an admin to create some."
              : "No matches"
          }
        />
      </FormField>
      {errors.root?.message && <div className="error">{errors.root.message}</div>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Log call"}
        </button>
      </div>
    </form>
  );
}

function WhatsappTab({ leadId }: { leadId: string }) {
  const { data, isLoading } = useWhatsappByLead(leadId);
  const deleteMsg = useDeleteWhatsapp(leadId);
  const [open, setOpen] = useState(false);

  const columns: Column<WhatsappMessage>[] = [
    {
      key: "direction",
      header: "Direction",
      render: (r) => (
        <span className={`badge ${r.direction === "OUTBOUND" ? "badge-pending" : "badge-neutral"}`}>
          {r.direction}
        </span>
      ),
    },
    { key: "body", header: "Message", render: (r) => r.body },
    { key: "agent", header: "By", render: (r) => r.agent.name },
    {
      key: "sentAt",
      header: "When",
      render: (r) => new Date(r.sentAt).toLocaleString(),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            if (confirm("Delete this message?")) deleteMsg.mutate(r.id);
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="card">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>WhatsApp messages</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
          + Log message
        </button>
      </div>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(r) => r.id}
        loading={isLoading}
        emptyMessage="No messages logged yet"
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Log WhatsApp message">
        <LogWhatsappForm
          onSuccess={() => setOpen(false)}
          onSubmit={async (values) => {
            await useLogWhatsapp(leadId).mutateAsync(cleanWhatsappPayload(values));
          }}
        />
      </Modal>
    </div>
  );
}

function LogWhatsappForm({
  onSuccess,
  onSubmit,
}: {
  onSuccess: () => void;
  onSubmit: (values: LogWhatsappValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LogWhatsappValues>({
    resolver: zodResolver(logWhatsappSchema),
    defaultValues: { direction: "OUTBOUND", body: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset();
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError("root", { message: err.message });
      } else {
        setError("root", { message: "Failed to log message" });
      }
    }
  });

  return (
    <form className="form" onSubmit={submit} noValidate>
      <FormField label="Direction" htmlFor="direction" error={errors.direction?.message}>
        <select id="direction" {...register("direction")}>
          <option value="OUTBOUND">Outbound</option>
          <option value="INBOUND">Inbound</option>
        </select>
      </FormField>
      <FormField label="Message" htmlFor="body" error={errors.body?.message}>
        <textarea id="body" rows={4} {...register("body")} />
      </FormField>
      {errors.root?.message && <div className="error">{errors.root.message}</div>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Log message"}
        </button>
      </div>
    </form>
  );
}

function PlaceholderTab({ kind }: { kind: string }) {
  return (
    <div className="card">
      <h2>{kind}</h2>
      <p className="muted">This tab is populated in later phases.</p>
    </div>
  );
}

function CoursesTab({ lead }: { lead: Lead }) {
  const { data: coursesData, isLoading: coursesLoading } = useActiveCourses();
  const allCourses: Course[] = coursesData?.items ?? [];
  const setInterests = useSetLeadInterests(lead.id);
  const [open, setOpen] = useState(false);

  // Build MultiSelect options: include ALL active courses, plus any inactive
  // courses that are still attached to this lead (so users can remove them).
  const interests = lead.courseInterests ?? [];
  const inactiveAttached = interests
    .filter((i) => !i.course.isActive)
    .map((i) => i.course);
  const optionsForSelect = [
    ...allCourses.map((c) => ({ id: c.id, label: c.name, disabled: false })),
    ...inactiveAttached
      .filter((c) => !allCourses.some((a) => a.id === c.id))
      .map((c) => ({ id: c.id, label: c.name, disabled: true })),
  ];
  const value = interests.map((i) => i.courseId);

  return (
    <div className="card">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Course interests</h2>
          <p className="muted" style={{ margin: "4px 0 0 0" }}>
            Track which courses this customer is interested in enrolling in next.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setOpen(true)}
          disabled={coursesLoading}
        >
          Manage interests
        </button>
      </div>

      {interests.length === 0 ? (
        <p className="interest-empty">
          No course interests recorded yet. Click <strong>Manage interests</strong> to add some, or
          log a call with the <em>Interested</em> outcome and pick courses from the call form.
        </p>
      ) : (
        <div className="interest-chips">
          {interests.map((i) => (
            <span
              key={i.id}
              className="chip"
              data-inactive={!i.course.isActive ? "true" : undefined}
            >
              {i.course.name}
              {!i.course.isActive && " (inactive)"}
            </span>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Manage course interests">
        <ManageInterestsForm
          leadId={lead.id}
          options={optionsForSelect}
          initial={value}
          submitting={setInterests.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={async (ids) => {
            await setInterests.mutateAsync(ids);
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

function ManageInterestsForm({
  leadId,
  options,
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  leadId: string;
  options: { id: string; label: string; disabled?: boolean }[];
  initial: string[];
  submitting: boolean;
  onSubmit: (ids: string[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        try {
          await onSubmit(selected);
        } catch (err) {
          setError(
            err instanceof ApiClientError ? err.message : "Failed to save course interests",
          );
        }
      }}
      noValidate
    >
      <FormField
        label="Interested courses"
        htmlFor={`courses-${leadId}`}
        error={error ?? undefined}
      >
        <MultiSelect
          id={`courses-${leadId}`}
          options={options}
          value={selected}
          onChange={setSelected}
          placeholder="Search courses…"
          emptyMessage="No courses available"
          showInactiveHint
        />
      </FormField>
      <p className="muted" style={{ marginTop: -8, fontSize: 13 }}>
        Inactive courses are shown only when already attached to this lead so you can remove them.
      </p>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save interests"}
        </button>
      </div>
    </form>
  );
}

function FollowUpsTab({ leadId }: { leadId: string }) {
  const { data, isLoading } = useFollowUps({});
  const scheduleFU = useScheduleFollowUp(leadId);
  const updateFU = useUpdateFollowUp(leadId);
  const deleteFU = useDeleteFollowUp(leadId);
  const [open, setOpen] = useState(false);

  const items = (data?.items ?? []).filter((f) => f.leadId === leadId);

  const columns: Column<FollowUp>[] = [
    {
      key: "scheduledFor",
      header: "Scheduled",
      render: (r) => new Date(r.scheduledFor).toLocaleString(),
    },
    { key: "agent", header: "Agent", render: (r) => r.agent.name },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "note",
      header: "Note",
      render: (r) => r.note ?? <span className="muted">—</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex">
          {r.status !== "DONE" && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => updateFU.mutate({ id: r.id, body: { status: "DONE" } })}
            >
              Mark done
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              if (confirm("Delete this follow-up?")) deleteFU.mutate(r.id);
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="card">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>Follow-ups</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
          + Schedule
        </button>
      </div>
      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(r) => r.id}
        loading={isLoading}
        emptyMessage="No follow-ups for this lead"
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Schedule follow-up">
        <ScheduleFollowUpForm
          onSuccess={() => setOpen(false)}
          onSubmit={async (values) => {
            await scheduleFU.mutateAsync(cleanFollowUpPayload(values));
          }}
        />
      </Modal>
    </div>
  );
}

function ScheduleFollowUpForm({
  onSuccess,
  onSubmit,
}: {
  onSuccess: () => void;
  onSubmit: (values: ScheduleFollowUpValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFollowUpValues>({
    resolver: zodResolver(scheduleFollowUpSchema),
    defaultValues: { scheduledFor: "", note: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset();
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError("root", { message: err.message });
      } else {
        setError("root", { message: "Failed to schedule follow-up" });
      }
    }
  });

  return (
    <form className="form" onSubmit={submit} noValidate>
      <FormField label="Date & time *" htmlFor="scheduledFor" error={errors.scheduledFor?.message}>
        <input id="scheduledFor" type="datetime-local" {...register("scheduledFor")} />
      </FormField>
      <FormField label="Note" htmlFor="note" error={errors.note?.message}>
        <textarea id="note" rows={3} {...register("note")} />
      </FormField>
      {errors.root?.message && <div className="error">{errors.root.message}</div>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Schedule"}
        </button>
      </div>
    </form>
  );
}

function PukuTab({ leadId }: { leadId: string }) {
  const { data, isLoading } = usePukuByLead(leadId);
  const requestPukuMut = useRequestPuku(leadId);
  const [open, setOpen] = useState(false);

  const items = data?.items ?? [];

  const columns: Column<PukuAccessRequest>[] = [
    {
      key: "requestedBy",
      header: "Requested by",
      render: (r) => r.requestedBy.name,
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => r.reason ?? <span className="muted">—</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "decidedBy",
      header: "Decided by",
      render: (r) =>
        r.decidedBy ? (
          <>
            {r.decidedBy.name}{" "}
            <span className="muted">
              ({r.decidedAt ? new Date(r.decidedAt).toLocaleDateString() : ""})
            </span>
          </>
        ) : (
          <span className="muted">—</span>
        ),
    },
  ];

  return (
    <div className="card">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>Puku access requests</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
          + Request access
        </button>
      </div>
      <DataTable
        columns={columns}
        rows={items}
        getRowKey={(r) => r.id}
        loading={isLoading}
        emptyMessage="No Puku access requests yet"
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Request Puku access">
        <RequestPukuForm
          onSuccess={() => setOpen(false)}
          onSubmit={async (values) => {
            await requestPukuMut.mutateAsync(cleanRequestPuku(values));
          }}
        />
      </Modal>
    </div>
  );
}

function RequestPukuForm({
  onSuccess,
  onSubmit,
}: {
  onSuccess: () => void;
  onSubmit: (values: RequestPukuValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestPukuValues>({
    resolver: zodResolver(requestPukuSchema),
    defaultValues: { reason: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset();
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError("root", { message: err.message });
      } else {
        setError("root", { message: "Failed to submit request" });
      }
    }
  });

  return (
    <form className="form" onSubmit={submit} noValidate>
      <FormField label="Reason (optional)" htmlFor="reason" error={errors.reason?.message}>
        <textarea id="reason" rows={3} {...register("reason")} />
      </FormField>
      {errors.root?.message && <div className="error">{errors.root.message}</div>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit request"}
        </button>
      </div>
    </form>
  );
}
