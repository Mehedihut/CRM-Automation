// Shared domain types for the client.
// Mirrors the server's Prisma enums and shapes.

export type Role = "ADMIN" | "AGENT";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "FOLLOW_UP"
  | "CONVERTED"
  | "LOST";

export type CallOutcome =
  | "CONNECTED"
  | "NO_ANSWER"
  | "VOICEMAIL"
  | "BAD_NUMBER"
  | "NOT_INTERESTED"
  | "INTERESTED"
  | "FOLLOW_UP_SCHEDULED";

export type FollowUpStatus = "PENDING" | "DONE" | "CANCELLED";

export type PukuAccessStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Lead {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  company: string | null;
  source: string | null;
  notes: string | null;
  status: LeadStatus;
  assignedToId: string | null;
  assignedTo: Pick<User, "id" | "name" | "email"> | null;
  courseInterests: LeadCourseInterest[];
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadCourseInterest {
  id: string;
  courseId: string;
  course: Pick<Course, "id" | "name" | "isActive">;
  createdAt: string;
}

export interface LeadListResult {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Call {
  id: string;
  leadId: string;
  agentId: string;
  agent: Pick<User, "id" | "name">;
  outcome: CallOutcome;
  durationSec: number | null;
  notes: string | null;
  calledAt: string;
  createdAt: string;
}

export interface WhatsappMessage {
  id: string;
  leadId: string;
  agentId: string;
  agent: Pick<User, "id" | "name">;
  direction: "OUTBOUND" | "INBOUND";
  body: string;
  sentAt: string;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  agentId: string;
  agent: Pick<User, "id" | "name">;
  scheduledFor: string;
  status: FollowUpStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: Pick<Lead, "id" | "fullName">;
}

export interface PukuAccessRequest {
  id: string;
  leadId: string;
  lead?: Pick<Lead, "id" | "fullName">;
  requestedById: string;
  requestedBy: Pick<User, "id" | "name">;
  status: PukuAccessStatus;
  reason: string | null;
  decidedById: string | null;
  decidedBy: Pick<User, "id" | "name"> | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totals: {
    leads: number;
    calls: number;
    whatsapps: number;
    pendingFollowUps: number;
    pukuPending: number;
  };
  leadsByStatus: Record<LeadStatus, number>;
  recentActivity: Array<{
    kind: "call" | "whatsapp" | "followUp" | "puku" | "lead";
    at: string;
    summary: string;
    leadId?: string;
    leadName?: string;
  }>;
  agentPerformance: Array<{
    agentId: string;
    name: string;
    callsLogged: number;
    leadsAssigned: number;
    conversions: number;
  }>;
  courseInterest: Array<{
    courseId: string;
    courseName: string;
    isActive: boolean;
    interested: number;
    followUps: number;
    converted: number;
  }>;
}
