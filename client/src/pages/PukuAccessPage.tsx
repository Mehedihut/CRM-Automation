import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoleGate } from "../components/RoleGate";
import { DataTable, type Column } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { useDecidePuku, usePukuRequests } from "../hooks/usePuku";
import type { PukuAccessRequest, PukuAccessStatus } from "../types/domain";
import { decidePukuSchema, type DecidePukuValues } from "../schemas/puku.schema";
import { ApiClientError } from "../services/api";

export function PukuAccessPage() {
  return (
    <RoleGate role="ADMIN">
      <PukuAccessPageInner />
    </RoleGate>
  );
}

function PukuAccessPageInner() {
  const [status, setStatus] = useState<PukuAccessStatus | "">("PENDING");
  const { data, isLoading, error } = usePukuRequests({
    status: status || undefined,
  });
  const decide = useDecidePuku();
  const [deciding, setDeciding] = useState<PukuAccessRequest | null>(null);

  const columns: Column<PukuAccessRequest>[] = [
    {
      key: "lead",
      header: "Lead",
      render: (r) =>
        r.lead ? <Link to={`/leads/${r.lead.id}`}>{r.lead.fullName}</Link> : "—",
    },
    { key: "requestedBy", header: "Requested by", render: (r) => r.requestedBy.name },
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
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "PENDING" ? (
          <div className="flex">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                decide.mutate({ id: r.id, body: { status: "APPROVED" } });
              }}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => setDeciding(r)}
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="muted">
            {r.decidedBy ? `by ${r.decidedBy.name}` : ""}{" "}
            {r.decidedAt ? new Date(r.decidedAt).toLocaleDateString() : ""}
          </span>
        ),
    },
  ];

  return (
    <main className="page">
      <header className="page-header">
        <h1>Puku Access Requests</h1>
      </header>

      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value as PukuAccessStatus | "")}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && <div className="error">Failed to load: {String(error)}</div>}

      <div className="card">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowKey={(r) => r.id}
          loading={isLoading}
          emptyMessage="No requests"
        />
      </div>

      <Modal open={Boolean(deciding)} onClose={() => setDeciding(null)} title="Reject request">
        {deciding && (
          <RejectForm
            onCancel={() => setDeciding(null)}
            onSubmit={async (values) => {
              await decide.mutateAsync({
                id: deciding.id,
                body: { status: "REJECTED", reason: values.reason },
              });
              setDeciding(null);
            }}
          />
        )}
      </Modal>
    </main>
  );
}

function RejectForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (values: DecidePukuValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DecidePukuValues>({
    resolver: zodResolver(decidePukuSchema),
    defaultValues: { status: "REJECTED", reason: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError("root", { message: err.message });
      } else {
        setError("root", { message: "Failed to reject" });
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
        <button type="button" className="btn" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
          {isSubmitting ? "Rejecting…" : "Reject"}
        </button>
      </div>
    </form>
  );
}
