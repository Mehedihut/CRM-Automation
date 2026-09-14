import { api } from "./api";
import type { Call, CallOutcome } from "../types/domain";

export interface LogCallInput {
  outcome: CallOutcome;
  durationSec?: number | null;
  notes?: string | null;
  calledAt?: string;
}

export const callsApi = {
  listByLead(leadId: string): Promise<{ items: Call[] }> {
    return api.get<{ items: Call[] }>(`/api/leads/${leadId}/calls`);
  },
  log(leadId: string, input: LogCallInput): Promise<Call> {
    return api.post<Call>(`/api/leads/${leadId}/calls`, input);
  },
  remove(id: string): Promise<{ ok: true }> {
    return api.delete<{ ok: true }>(`/api/calls/${id}`);
  },
};
