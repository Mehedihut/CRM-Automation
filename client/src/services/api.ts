import { config } from "../config";
import type { ApiResponse, HealthData } from "../types/api";
import type {
  CreateTeamMemberInput,
  TeamMember,
  UpdateTeamMemberInput,
} from "../types/team";
import type {
  CreateLeadInput,
  Lead,
  ListLeadsQuery,
  UpdateLeadInput,
} from "../types/leads";
import type { LoginInput, User } from "../types/auth";
import type { Call, CreateCallInput } from "../types/calls";
import type { CreateWhatsAppInput, WhatsAppMessage } from "../types/whatsapp";
import type {
  CreateFollowUpInput,
  FollowUp,
  ListFollowUpsQuery,
  UpdateFollowUpInput,
} from "../types/followups";
import type {
  CreatePukuRequestInput,
  ListPukuRequestsQuery,
  PukuAccessRequest,
  PukuDecisionInput,
  UpdatePukuRequestInput,
} from "../types/puku";
import type { DashboardStats } from "../types/dashboard";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      credentials: "include",
      ...init,
    });
  } catch (err) {
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      err instanceof Error ? err.message : "Network error",
    );
  }

  // 204 No Content (and any empty body) → resolve to undefined cast as T.
  if (response.status === 204) {
    return undefined as T;
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      response.status,
      "INVALID_RESPONSE",
      "Server returned a non-JSON response.",
    );
  }

  if (body && body.success) return body.data;

  if (body && body.success === false) {
    throw new ApiClientError(
      response.status,
      body.error.code,
      body.error.message,
      body.error.details,
    );
  }

  throw new ApiClientError(
    response.status,
    "UNKNOWN_ERROR",
    `Request failed with status ${response.status}`,
  );
}

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  getHealth(): Promise<HealthData> {
    return request<HealthData>("/api/health");
  },

  // Auth
  login(input: LoginInput): Promise<{ user: User }> {
    return request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  logout(): Promise<void> {
    return request<void>("/api/auth/logout", { method: "POST" });
  },
  me(): Promise<{ user: User }> {
    return request<{ user: User }>("/api/auth/me");
  },

  // Team
  listTeam(): Promise<TeamMember[]> {
    return request<TeamMember[]>("/api/team");
  },
  getTeamMember(id: number): Promise<TeamMember> {
    return request<TeamMember>(`/api/team/${id}`);
  },
  createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
    return request<TeamMember>("/api/team", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateTeamMember(id: number, input: UpdateTeamMemberInput): Promise<TeamMember> {
    return request<TeamMember>(`/api/team/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteTeamMember(id: number): Promise<void> {
    return request<void>(`/api/team/${id}`, { method: "DELETE" });
  },

  // Leads
  listLeads(query?: ListLeadsQuery): Promise<Lead[]> {
    return request<Lead[]>(`/api/leads${toQuery(query as Record<string, unknown> | undefined)}`);
  },
  getLead(id: number): Promise<Lead> {
    return request<Lead>(`/api/leads/${id}`);
  },
  createLead(input: CreateLeadInput): Promise<Lead> {
    return request<Lead>("/api/leads", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateLead(id: number, input: UpdateLeadInput): Promise<Lead> {
    return request<Lead>(`/api/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteLead(id: number): Promise<void> {
    return request<void>(`/api/leads/${id}`, { method: "DELETE" });
  },
  assignLead(id: number, userId: number | null): Promise<Lead> {
    return request<Lead>(`/api/leads/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },

  // Calls
  listCalls(): Promise<Call[]> {
    return request<Call[]>("/api/calls");
  },
  listCallsForLead(leadId: number): Promise<Call[]> {
    return request<Call[]>(`/api/calls/lead/${leadId}`);
  },
  createCall(input: CreateCallInput): Promise<Call> {
    return request<Call>("/api/calls", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // WhatsApp
  listWhatsAppForLead(leadId: number): Promise<WhatsAppMessage[]> {
    return request<WhatsAppMessage[]>(`/api/whatsapp/${leadId}`);
  },
  createWhatsApp(leadId: number, input: CreateWhatsAppInput): Promise<WhatsAppMessage> {
    return request<WhatsAppMessage>(`/api/whatsapp/${leadId}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Follow-ups
  listFollowUps(query?: ListFollowUpsQuery): Promise<FollowUp[]> {
    return request<FollowUp[]>(`/api/follow-ups${toQuery(query as Record<string, unknown> | undefined)}`);
  },
  getFollowUp(id: number): Promise<FollowUp> {
    return request<FollowUp>(`/api/follow-ups/${id}`);
  },
  createFollowUp(input: CreateFollowUpInput): Promise<FollowUp> {
    return request<FollowUp>("/api/follow-ups", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateFollowUp(id: number, input: UpdateFollowUpInput): Promise<FollowUp> {
    return request<FollowUp>(`/api/follow-ups/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteFollowUp(id: number): Promise<void> {
    return request<void>(`/api/follow-ups/${id}`, { method: "DELETE" });
  },

  // Puku access requests
  listPukuRequests(query?: ListPukuRequestsQuery): Promise<PukuAccessRequest[]> {
    return request<PukuAccessRequest[]>(`/api/puku-access${toQuery(query as Record<string, unknown> | undefined)}`);
  },
  getPukuRequest(id: number): Promise<PukuAccessRequest> {
    return request<PukuAccessRequest>(`/api/puku-access/${id}`);
  },
  createPukuRequest(input: CreatePukuRequestInput): Promise<PukuAccessRequest> {
    return request<PukuAccessRequest>("/api/puku-access", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updatePukuRequest(id: number, input: UpdatePukuRequestInput): Promise<PukuAccessRequest> {
    return request<PukuAccessRequest>(`/api/puku-access/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deletePukuRequest(id: number): Promise<void> {
    return request<void>(`/api/puku-access/${id}`, { method: "DELETE" });
  },
  approvePukuRequest(id: number, input: PukuDecisionInput): Promise<PukuAccessRequest> {
    return request<PukuAccessRequest>(`/api/puku-access/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  rejectPukuRequest(id: number, input: PukuDecisionInput): Promise<PukuAccessRequest> {
    return request<PukuAccessRequest>(`/api/puku-access/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Dashboard
  getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>("/api/dashboard/stats");
  },
};
