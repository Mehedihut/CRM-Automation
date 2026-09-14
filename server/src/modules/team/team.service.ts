import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "./team.schema";
import type { Role } from "../../utils/prismaEnums";

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "AGENT";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

function toMember(u: {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "AGENT";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TeamMember {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export async function listTeam(): Promise<TeamMember[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });
  return users.map((u) => toMember({ ...u, role: u.role as Role }));
}

export async function listAgents(): Promise<TeamMember[]> {
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return users.map((u) => toMember({ ...u, role: u.role as Role }));
}

export async function createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("A user with that email already exists");
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
    },
  });
  return toMember({ ...user, role: user.role as Role });
}

export async function updateTeamMember(
  id: string,
  input: UpdateTeamMemberInput,
): Promise<TeamMember> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    return toMember({ ...user, role: user.role as Role });
  } catch {
    throw ApiError.notFound("User not found");
  }
}

export async function softDeleteTeamMember(id: string): Promise<void> {
  try {
    await prisma.user.update({ where: { id }, data: { active: false } });
  } catch {
    throw ApiError.notFound("User not found");
  }
}
