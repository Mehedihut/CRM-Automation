export interface TeamMember {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberInput {
  name: string;
  email: string;
}

export interface UpdateTeamMemberInput {
  name?: string;
  email?: string;
}
