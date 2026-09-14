import { useState } from "react";
import { Link } from "react-router-dom";
import { useFollowUps, useUpdateFollowUp, useDeleteFollowUp } from "../hooks/useFollowUps";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import type { FollowUp, FollowUpStatus } from "../types/domain";
import { FOLLOWUP_STATUSES } from "../schemas/followups.schema";

export function FollowUpsPage() {
  const [status, setStatus] = useState<FollowUpStatus | "">("");
  const { data, isLoading, error } = useFollowUps({
    status: status || undefined,
  });
  const updateFU = useUpdateFollowUp();
  const deleteFU = useDeleteFollowUp();

  const columns: Column<FollowUp>[] = [
    {
      key: "lead",
      header: "Lead",
      render: (r) =>
        r.lead ? <Link to={`/leads/${r.lead.id}`}>{r.lead.fullName}</Link> : "—",
    },
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
              onClick={() =>
                updateFU.mutate({ id: r.id, body: { status: "DONE" } })
              }
            >
              Mark done
            </button>
          )}
          {r.status !== "CANCELLED" && r.status !== "DONE" && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                updateFU.mutate({ id: r.id, body: { status: "CANCELLED" } })
              }
            >
              Cancel
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
    <main className="page">
      <header className="page-header">
        <h1>Follow-ups</h1>
      </header>

      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value as FollowUpStatus | "")}>
          <option value="">All statuses</option>
          {FOLLOWUP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error">Failed to load follow-ups: {String(error)}</div>}

      <div className="card">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowKey={(r) => r.id}
          loading={isLoading}
          emptyMessage="No follow-ups yet"
        />
      </div>
    </main>
  );
}
