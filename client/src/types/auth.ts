export type UserRole = "ADMIN" | "AGENT";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}
