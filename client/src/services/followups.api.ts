import { api } from "./api";
import type { FollowUp, FollowUpStatus } from "../types/domain";

export interface ScheduleFollowUpInput {
  scheduledFor: string; // ISO
  note?: string | null;
}

export const followUpsApi = {
  list(filters: { status?: FollowUpStatus; assignedToMe?: boolean } = {}): Promise<{
    items: FollowUp[];
  }> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.assignedToMe) params.set("assignedToMe", "true");
    const q = params.toString();
    return api.get<{ items: FollowUp[] }>(`/api/follow-ups${q ? `?${q}` : ""}`);
  },
  schedule(leadId: string, input: ScheduleFollowUpInput): Promise<FollowUp> {
    return api.post<FollowUp>(`/api/leads/${leadId}/follow-ups`, input);
  },
  update(id: string, body: Partial<{ status: FollowUpStatus; scheduledFor: string; note: string }>): Promise<FollowUp> {
    return api.patch<FollowUp>(`/api/follow-ups/${id}`, body);
  },
  remove(id: string): Promise<{ ok: true }> {
    return api.delete<{ ok: true }>(`/api/follow-ups/${id}`);
  },
};
