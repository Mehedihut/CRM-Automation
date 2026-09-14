import { api } from "./api";
import type { Role } from "../types/domain";

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const teamApi = {
  list(): Promise<{ items: TeamMember[] }> {
    return api.get<{ items: TeamMember[] }>("/api/team");
  },
  listAgents(): Promise<{ items: TeamMember[] }> {
    return api.get<{ items: TeamMember[] }>("/api/team/agents");
  },
  create(body: { email: string; name: string; password: string; role: Role }): Promise<TeamMember> {
    return api.post<TeamMember>("/api/team", body);
  },
  update(id: string, body: Partial<{ name: string; role: Role; active: boolean }>): Promise<TeamMember> {
    return api.patch<TeamMember>(`/api/team/${id}`, body);
  },
  remove(id: string): Promise<{ ok: true }> {
    return api.delete<{ ok: true }>(`/api/team/${id}`);
  },
};
