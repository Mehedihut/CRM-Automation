import { api } from "./api";
import type { WhatsappMessage } from "../types/domain";

export interface LogWhatsappInput {
  direction: "OUTBOUND" | "INBOUND";
  body: string;
  sentAt?: string;
}

export const whatsappApi = {
  listByLead(leadId: string): Promise<{ items: WhatsappMessage[] }> {
    return api.get<{ items: WhatsappMessage[] }>(`/api/leads/${leadId}/whatsapp`);
  },
  log(leadId: string, input: LogWhatsappInput): Promise<WhatsappMessage> {
    return api.post<WhatsappMessage>(`/api/leads/${leadId}/whatsapp`, input);
  },
  remove(id: string): Promise<{ ok: true }> {
    return api.delete<{ ok: true }>(`/api/whatsapp/${id}`);
  },
};
