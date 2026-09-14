import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTeamMemberSchema,
  type CreateTeamMemberValues,
} from "../schemas/team.schema";
import { RoleGate } from "../components/RoleGate";
import { DataTable, type Column } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";
import {
  useCreateTeamMember,
  useDeleteTeamMember,
  useTeam,
  useUpdateTeamMember,
} from "../hooks/useTeam";
import type { TeamMember } from "../services/team.api";
import { ApiClientError } from "../services/api";

export function TeamPage() {
  return (
    <RoleGate role="ADMIN">
      <TeamPageInner />
    </RoleGate>
  );
}

function TeamPageInner() {
  const { data, isLoading, error } = useTeam();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const [showCreate, setShowCreate] = useState(false);

  const columns: Column<TeamMember>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    { key: "email", header: "Email", render: (r) => r.email },
    {
      key: "role",
      header: "Role",
      render: (r) => <span className="nav-role">{r.role}</span>,
    },
    {
      key: "active",
      header: "Active",
      render: (r) =>
        r.active ? (
          <span className="badge badge-ok">Active</span>
        ) : (
          <span className="badge badge-neutral">Inactive</span>
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              updateMember.mutate({
                id: r.id,
                body: { active: !r.active },
              })
            }
          >
            {r.active ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (confirm(`Deactivate ${r.name}?`)) deleteMember.mutate(r.id);
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
        <h1>Team</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
        >
          + Add member
        </button>
      </header>

      {error && <div className="error">Failed to load team: {String(error)}</div>}

      <div className="card">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowKey={(r) => r.id}
          loading={isLoading}
          emptyMessage="No team members yet"
        />
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add team member">
        <CreateTeamMemberForm
          onSuccess={() => setShowCreate(false)}
          create={async (values) => {
            await createMember.mutateAsync(values);
          }}
        />
      </Modal>
    </main>
  );
}

function CreateTeamMemberForm({
  onSuccess,
  create,
}: {
  onSuccess: () => void;
  create: (values: CreateTeamMemberValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamMemberValues>({
    resolver: zodResolver(createTeamMemberSchema),
    defaultValues: { email: "", name: "", password: "", role: "AGENT" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await create(values);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError("root", { message: err.message });
      } else {
        setError("root", { message: "Failed to create member" });
      }
    }
  });

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <FormField label="Name *" htmlFor="name" error={errors.name?.message}>
        <input id="name" {...register("name")} />
      </FormField>
      <FormField label="Email *" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" {...register("email")} />
      </FormField>
      <FormField
        label="Password *"
        htmlFor="password"
        error={errors.password?.message}
      >
        <input id="password" type="password" {...register("password")} />
      </FormField>
      <FormField label="Role" htmlFor="role" error={errors.role?.message}>
        <select id="role" {...register("role")}>
          <option value="AGENT">Agent</option>
          <option value="ADMIN">Admin</option>
        </select>
      </FormField>
      {errors.root?.message && <div className="error">{errors.root.message}</div>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create member"}
        </button>
      </div>
    </form>
  );
}
