import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  cleanCoursePayload,
  courseFormSchema,
  type CourseFormValues,
} from "../schemas/courses.schema";
import { RoleGate } from "../components/RoleGate";
import { DataTable, type Column } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";
import {
  useCreateCourse,
  useDeleteCourse,
  useCourses,
  useUpdateCourse,
} from "../hooks/useCourses";
import type { Course } from "../types/domain";
import { ApiClientError } from "../services/api";

export function CoursesPage() {
  return (
    <RoleGate role="ADMIN">
      <CoursesPageInner />
    </RoleGate>
  );
}

function CoursesPageInner() {
  const [showInactive, setShowInactive] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useCourses({ includeInactive: showInactive });
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const items = (data?.items ?? []).filter((c) =>
    !search.trim() ? true : c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const columns: Column<Course>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    {
      key: "description",
      header: "Description",
      render: (r) =>
        r.description ? (
          <span>{r.description}</span>
        ) : (
          <span className="muted">—</span>
        ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (r) =>
        r.isActive ? (
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
            onClick={() => setEditing(r)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              updateCourse.mutate({
                id: r.id,
                body: { isActive: !r.isActive },
              })
            }
            disabled={updateCourse.isPending}
          >
            {r.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (confirm(`Deactivate "${r.name}"? Leads keep their existing interests.`)) {
                deleteCourse.mutate(r.id);
              }
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
        <h1>Courses</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setCreating(true)}
        >
          + New course
        </button>
      </header>

      {error && <div className="error">Failed to load courses: {String(error)}</div>}

      <div className="toolbar">
        <input
          className="grow"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex" style={{ gap: 6 }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(r) => r.id}
          loading={isLoading}
          emptyMessage={search ? "No courses match your search" : "No courses yet"}
        />
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New course">
        <CourseForm
          onSuccess={() => setCreating(false)}
          onSubmit={async (values) => {
            await createCourse.mutateAsync(cleanCoursePayload(values));
          }}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit "${editing.name}"` : ""}
      >
        {editing && (
          <CourseForm
            initial={{
              name: editing.name,
              description: editing.description ?? "",
              isActive: editing.isActive,
            }}
            submitLabel="Save changes"
            onSuccess={() => setEditing(null)}
            onSubmit={async (values) => {
              await updateCourse.mutateAsync({
                id: editing.id,
                body: cleanCoursePayload(values),
              });
            }}
          />
        )}
      </Modal>
    </main>
  );
}

function CourseForm({
  onSuccess,
  onSubmit,
  initial,
  submitLabel = "Create course",
}: {
  onSuccess: () => void;
  onSubmit: (values: CourseFormValues) => Promise<void>;
  initial?: Partial<CourseFormValues>;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      isActive: initial?.isActive ?? true,
    },
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
        setError("root", { message: "Failed to save course" });
      }
    }
  });

  return (
    <form className="form" onSubmit={submit} noValidate>
      <FormField label="Name *" htmlFor="course-name" error={errors.name?.message}>
        <input id="course-name" {...register("name")} />
      </FormField>
      <FormField
        label="Description"
        htmlFor="course-description"
        error={errors.description?.message}
      >
        <textarea id="course-description" rows={3} {...register("description")} />
      </FormField>
      <FormField label="Active" htmlFor="course-active" error={errors.isActive?.message}>
        <label className="flex" style={{ gap: 6 }}>
          <input id="course-active" type="checkbox" {...register("isActive")} />
          Available to agents
        </label>
      </FormField>
      {errors.root?.message && <div className="error">{errors.root.message}</div>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
