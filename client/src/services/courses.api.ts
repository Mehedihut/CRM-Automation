import { api } from "./api";
import type { Course } from "../types/domain";

export const coursesApi = {
  list: (params?: { includeInactive?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.includeInactive) search.set("includeInactive", "true");
    const qs = search.toString();
    return api.get<{ items: Course[] }>(`/api/courses${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => api.get<Course>(`/api/courses/${id}`),
  create: (body: { name: string; description?: string | null; isActive?: boolean }) =>
    api.post<Course>("/api/courses", body),
  update: (
    id: string,
    body: Partial<{ name: string; description?: string | null; isActive?: boolean }>,
  ) => api.patch<Course>(`/api/courses/${id}`, body),
  remove: (id: string) => api.delete<{ ok: true }>(`/api/courses/${id}`),
};
