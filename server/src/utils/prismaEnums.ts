// String-literal "enum" types for the SQLite dev schema.
// In production (Postgres), these are generated as Prisma enums.

export type Role = "ADMIN" | "AGENT";
export const Role = {
  ADMIN: "ADMIN",
  AGENT: "AGENT",
} as const;

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "FOLLOW_UP"
  | "CONVERTED"
  | "LOST";
export const LeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  INTERESTED: "INTERESTED",
  FOLLOW_UP: "FOLLOW_UP",
  CONVERTED: "CONVERTED",
  LOST: "LOST",
} as const;

export type CallOutcome =
  | "CONNECTED"
  | "NO_ANSWER"
  | "VOICEMAIL"
  | "BAD_NUMBER"
  | "NOT_INTERESTED"
  | "FOLLOW_UP_SCHEDULED";
export const CallOutcome = {
  CONNECTED: "CONNECTED",
  NO_ANSWER: "NO_ANSWER",
  VOICEMAIL: "VOICEMAIL",
  BAD_NUMBER: "BAD_NUMBER",
  NOT_INTERESTED: "NOT_INTERESTED",
  FOLLOW_UP_SCHEDULED: "FOLLOW_UP_SCHEDULED",
} as const;

export type FollowUpStatus = "PENDING" | "DONE" | "CANCELLED";
export const FollowUpStatus = {
  PENDING: "PENDING",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;

export type PukuAccessStatus = "PENDING" | "APPROVED" | "REJECTED";
export const PukuAccessStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
