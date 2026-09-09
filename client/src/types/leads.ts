export interface LeadAssignee {
  id: number;
  name: string;
  email: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  assignedTo: number | null;
  assignee: LeadAssignee | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  notes?: string;
}

export interface UpdateLeadInput {
  name?: string;
  phone?: string;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
}

export interface ListLeadsQuery {
  assigneeId?: number;
  status?: string;
}
