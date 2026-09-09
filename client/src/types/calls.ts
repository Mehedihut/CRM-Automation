export type CallOutcome =
  | "CONTACTED"
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "UNREACHABLE"
  | "CONVERTED"
  | "FOLLOW_UP_SCHEDULED";

export const CALL_OUTCOMES: CallOutcome[] = [
  "CONTACTED",
  "INTERESTED",
  "NOT_INTERESTED",
  "UNREACHABLE",
  "CONVERTED",
  "FOLLOW_UP_SCHEDULED",
];

export interface CallAgent {
  id: number;
  name: string;
  email: string;
}

export interface Call {
  id: number;
  leadId: number;
  agentId: number;
  outcome: CallOutcome;
  notes: string | null;
  duration: number | null;
  createdAt: string;
  agent: CallAgent;
}

export interface CreateCallInput {
  leadId: number;
  outcome: CallOutcome;
  notes?: string;
  duration?: number;
}
