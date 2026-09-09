export const PUKU_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type PukuRequestStatus = (typeof PUKU_STATUSES)[number];

export interface PukuDecider {
  id: number;
  name: string;
  email: string;
}

export interface PukuAccessRequest {
  id: number;
  requesterName: string;
  requesterEmail: string | null;
  requesterPhone: string | null;
  requestedScope: string;
  reason: string | null;
  status: PukuRequestStatus;
  decidedById: number | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  updatedAt: string;
  decidedBy: PukuDecider | null;
}

export interface CreatePukuRequestInput {
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  requestedScope: string;
  reason?: string;
}

export interface UpdatePukuRequestInput {
  requesterName?: string;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  requestedScope?: string;
  reason?: string | null;
}

export interface PukuDecisionInput {
  note?: string;
}

export interface ListPukuRequestsQuery {
  status?: PukuRequestStatus;
}
