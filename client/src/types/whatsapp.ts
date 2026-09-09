export type WhatsAppDirection = "INBOUND" | "OUTBOUND";

export const WHATSAPP_DIRECTIONS: WhatsAppDirection[] = ["INBOUND", "OUTBOUND"];

export interface WhatsAppSender {
  id: number;
  name: string;
  email: string;
}

export interface WhatsAppMessage {
  id: number;
  leadId: number;
  senderId: number | null;
  direction: WhatsAppDirection;
  body: string;
  externalId: string | null;
  createdAt: string;
  sender: WhatsAppSender | null;
}

export interface CreateWhatsAppInput {
  direction: WhatsAppDirection;
  body: string;
}
