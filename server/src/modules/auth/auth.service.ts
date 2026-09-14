import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { signToken, type JwtPayload } from "../../utils/jwt";
import type { Role } from "../../utils/prismaEnums";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "AGENT";
}

export interface LoginResult {
  user: AuthenticatedUser;
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const role = user.role as Role;
  const payload: JwtPayload = { sub: user.id, email: user.email, role };
  const token = signToken(payload);
  return {
    user: { id: user.id, email: user.email, name: user.name, role },
    token,
  };
}

export async function getUserById(id: string): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.active) {
    throw ApiError.unauthorized("User not found or inactive");
  }
  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
}
