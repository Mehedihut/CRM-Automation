import type { PrismaClient, User } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
}

function toSafe(user: User): SafeUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function login(
  prisma: PrismaClient,
  email: string,
  password: string,
): Promise<{ user: SafeUser; token: string }> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Use a single error message for both "no such user" and "wrong password"
  // to avoid leaking which emails are registered.
  const INVALID = ApiError.unauthorized("Invalid email or password");

  if (!user) throw INVALID;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw INVALID;

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return { user: toSafe(user), token };
}

export async function getCurrentUser(prisma: PrismaClient, userId: number): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized("Session user no longer exists");
  return toSafe(user);
}
