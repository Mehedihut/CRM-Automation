import type { UserRole } from "./auth";

export const AUDIT_ACTIONS = [
  "PUKU_DECIDED",
  "LEAD_REASSIGNED",
  "AUTH_LOGIN_SUCCESS",
  "AUTH_LOGIN_FAILURE",
  "AUTH_LOGOUT",
  "AUTH_PASSWORD_RESET_REQUESTED",
  "AUTH_PASSWORD_RESET_COMPLETED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditActor {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuditLogEntry {
  id: number;
  action: AuditAction;
  entity: string | null;
  actorId: number | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: AuditActor | null;
}

export interface AuditListResponse {
  items: AuditLogEntry[];
  nextCursor: number | null;
}

export interface ListAuditQuery {
  action?: AuditAction;
  entity?: string;
  actorId?: number;
  from?: string; // ISO
  to?: string; // ISO
  cursor?: number;
  limit?: number;
}
