import { api } from "./api";
import type { PukuAccessRequest, PukuAccessStatus } from "../types/domain";

export const pukuApi = {
  list(filters: { status?: PukuAccessStatus } = {}): Promise<{ items: PukuAccessRequest[] }> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    const q = params.toString();
    return api.get<{ items: PukuAccessRequest[] }>(`/api/puku-access${q ? `?${q}` : ""}`);
  },
  listByLead(leadId: string): Promise<{ items: PukuAccessRequest[] }> {
    return api.get<{ items: PukuAccessRequest[] }>(`/api/puku-access/leads/${leadId}/puku-access`);
  },
  request(leadId: string, body: { reason?: string }): Promise<PukuAccessRequest> {
    return api.post<PukuAccessRequest>(`/api/puku-access/leads/${leadId}/puku-access`, body);
  },
  decide(id: string, body: { status: "APPROVED" | "REJECTED"; reason?: string }): Promise<PukuAccessRequest> {
    return api.patch<PukuAccessRequest>(`/api/puku-access/${id}`, body);
  },
};
