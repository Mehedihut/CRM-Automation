import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "../services/courses.api";
import type { Course } from "../types/domain";

export const coursesKeys = {
  all: ["courses"] as const,
  list: (includeInactive?: boolean) =>
    [...coursesKeys.all, "list", { includeInactive: !!includeInactive }] as const,
  detail: (id: string) => [...coursesKeys.all, "detail", id] as const,
};

export function useCourses(opts: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: coursesKeys.list(opts.includeInactive),
    queryFn: () => coursesApi.list(opts),
    staleTime: 30_000,
  });
}

export function useActiveCourses() {
  return useCourses({ includeInactive: false });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: id ? coursesKeys.detail(id) : coursesKeys.detail("__none__"),
    queryFn: () => coursesApi.get(id!),
    enabled: Boolean(id),
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: coursesKeys.all });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof coursesApi.create>[0]) =>
      coursesApi.create(body),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; body: Parameters<typeof coursesApi.update>[1] }) =>
      coursesApi.update(args.id, args.body),
    onSuccess: (_data, vars) => {
      invalidateAll(qc);
      qc.invalidateQueries({ queryKey: coursesKeys.detail(vars.id) });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: () => invalidateAll(qc),
  });
}

// Helper for pages that need the courses array unwrapped.
export function useCoursesList(opts: { includeInactive?: boolean } = {}):
  | Course[]
  | undefined {
  const q = useCourses(opts);
  return q.data?.items;
}
