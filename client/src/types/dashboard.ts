export type LeadStatusKey =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "UNREACHABLE"
  | "CONVERTED";

export type CallOutcomeKey =
  | "CONTACTED"
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "UNREACHABLE"
  | "CONVERTED"
  | "FOLLOW_UP_SCHEDULED";

export type PukuStatusKey = "PENDING" | "APPROVED" | "REJECTED";

export interface DashboardStats {
  leads: {
    total: number;
    byStatus: Record<LeadStatusKey, number>;
    unassigned: number;
    byAssignee: { userId: number; name: string; count: number }[];
  };
  calls: {
    total: number;
    byOutcome: Record<CallOutcomeKey, number>;
    last7Days: { date: string; count: number }[];
  };
  followUps: {
    dueToday: number;
    overdue: number;
    pending: number;
  };
  whatsapp: {
    sentToday: number;
    receivedToday: number;
  };
  puku: {
    byStatus: Record<PukuStatusKey, number>;
  };
}
