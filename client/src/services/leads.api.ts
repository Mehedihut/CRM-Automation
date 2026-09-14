import { api } from "./api";
import type { Lead, LeadCourseInterest, LeadListResult, LeadStatus } from "../types/domain";

export interface LeadsFilters {
  status?: LeadStatus | "";
  assignedToId?: string;
  search?: string;
  courseId?: string;
  page?: number;
  pageSize?: number;
}

export const leadsApi = {
  list(filters: LeadsFilters = {}): Promise<LeadListResult> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);
    if (filters.search) params.set("search", filters.search);
    if (filters.courseId) params.set("courseId", filters.courseId);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
    const q = params.toString();
    return api.get<LeadListResult>(`/api/leads${q ? `?${q}` : ""}`);
  },
  get(id: string): Promise<Lead> {
    return api.get<Lead>(`/api/leads/${id}`);
  },
  create(body: Partial<Lead>): Promise<Lead> {
    return api.post<Lead>("/api/leads", body);
  },
  update(id: string, body: Partial<Lead>): Promise<Lead> {
    return api.patch<Lead>(`/api/leads/${id}`, body);
  },
  assign(id: string, assignedToId: string | null): Promise<Lead> {
    return api.patch<Lead>(`/api/leads/${id}/assign`, { assignedToId });
  },
  remove(id: string): Promise<{ ok: true }> {
    return api.delete<{ ok: true }>(`/api/leads/${id}`);
  },
  setCourseInterests(
    leadId: string,
    courseIds: string[],
  ): Promise<{ items: LeadCourseInterest[] }> {
    return api.put<{ items: LeadCourseInterest[] }>(
      `/api/leads/${leadId}/course-interests`,
      { courseIds },
    );
  },
};
