export type FollowUpStatus = "PENDING" | "DONE" | "MISSED" | "CANCELED";

export const FOLLOW_UP_STATUSES: FollowUpStatus[] = [
  "PENDING",
  "DONE",
  "MISSED",
  "CANCELED",
];

export interface FollowUpAssignee {
  id: number;
  name: string;
  email: string;
}

export interface FollowUpLead {
  id: number;
  name: string;
  phone: string;
}

export interface FollowUp {
  id: number;
  leadId: number;
  assigneeId: number;
  scheduledAt: string;
  status: FollowUpStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: FollowUpAssignee;
  lead: FollowUpLead;
}

export interface CreateFollowUpInput {
  leadId: number;
  assigneeId?: number;
  scheduledAt: string; // ISO
  notes?: string;
}

export interface UpdateFollowUpInput {
  scheduledAt?: string;
  status?: FollowUpStatus;
  notes?: string | null;
  assigneeId?: number;
}

export interface ListFollowUpsQuery {
  assigneeId?: number;
  status?: FollowUpStatus;
  leadId?: number;
  from?: string;
  to?: string;
}
