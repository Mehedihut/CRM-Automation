import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../lib/auth";
import { useLeads, useDeleteLead } from "../hooks/useLeads";
import { useActiveCourses } from "../hooks/useCourses";
import { DataTable, type Column } from "../components/DataTable";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import type { Lead, LeadStatus } from "../types/domain";
import { LEAD_STATUSES } from "../schemas/leads.schema";

export function LeadsListPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [page, setPage] = useState(1);
  const { data: coursesData } = useActiveCourses();

  // Allow drill-down from the dashboard: ?courseId=<id> preselects the filter.
  useEffect(() => {
    const param = searchParams.get("courseId");
    if (param && param !== courseId) {
      setCourseId(param);
      setPage(1);
    }
    // We deliberately only react to the param value (one-shot sync).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filters = useMemo(
    () => ({
      status: status || undefined,
      search: search.trim() || undefined,
      courseId: courseId || undefined,
      page,
      pageSize: 20,
    }),
    [status, search, courseId, page],
  );

  const { data, isLoading, error } = useLeads(filters);
  const deleteLead = useDeleteLead();

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <Link to={`/leads/${r.id}`}>
          <strong>{r.fullName}</strong>
        </Link>
      ),
    },
    { key: "phone", header: "Phone", render: (r) => r.phone },
    {
      key: "email",
      header: "Email",
      render: (r) => r.email ?? <span className="muted">—</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "assignedTo",
      header: "Assigned",
      render: (r) =>
        r.assignedTo ? r.assignedTo.name : <span className="muted">Unassigned</span>,
    },
    {
      key: "courseInterests",
      header: "Courses",
      render: (r) =>
        r.courseInterests && r.courseInterests.length > 0 ? (
          <div className="interest-chips" style={{ margin: 0 }}>
            {r.courseInterests.slice(0, 3).map((i) => (
              <span
                key={i.id}
                className="chip"
                data-inactive={!i.course.isActive ? "true" : undefined}
                style={{ fontSize: 11, padding: "2px 6px" }}
              >
                {i.course.name}
              </span>
            ))}
            {r.courseInterests.length > 3 && (
              <span className="muted" style={{ fontSize: 11 }}>
                +{r.courseInterests.length - 3} more
              </span>
            )}
          </div>
        ) : (
          <span className="muted">—</span>
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    ...(role === "ADMIN"
      ? [
          {
            key: "actions",
            header: "",
            render: (r: Lead) => (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete lead "${r.fullName}"?`)) {
                    deleteLead.mutate(r.id);
                  }
                }}
              >
                Delete
              </button>
            ),
          } satisfies Column<Lead>,
        ]
      : []),
  ];

  return (
    <main className="page">
      <header className="page-header">
        <h1>Leads</h1>
        {role === "ADMIN" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/leads/new")}
          >
            + New Lead
          </button>
        )}
      </header>

      <div className="toolbar">
        <input
          className="grow"
          placeholder="Search by name, email, phone, company…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as LeadStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={courseId}
          onChange={(e) => {
            const next = e.target.value;
            setCourseId(next);
            setPage(1);
            // Sync the URL so the filtered view is shareable.
            const sp = new URLSearchParams(searchParams);
            if (next) sp.set("courseId", next);
            else sp.delete("courseId");
            setSearchParams(sp, { replace: true });
          }}
        >
          <option value="">All courses</option>
          {(coursesData?.items ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error">Failed to load leads: {String(error)}</div>}

      <div className="card">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowKey={(r) => r.id}
          loading={isLoading}
          emptyMessage="No leads found"
        />
        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        )}
      </div>
    </main>
  );
}
