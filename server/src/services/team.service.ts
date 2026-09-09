import { PrismaClient, Prisma, type User } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { hashPassword } from "../utils/password";
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "../validators/team.schema";

// Exclude passwordHash from the user payload returned to the frontend.
function toSafe(user: User): User {
  // Build a new object so the passwordHash field is not in the response.
  // We rely on Prisma's `omit` once we upgrade; for now, copy fields.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe as User;
}

export async function listTeam(prisma: PrismaClient): Promise<User[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return users.map(toSafe);
}

export async function getTeamMember(
  prisma: PrismaClient,
  id: number,
): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }
  return toSafe(user);
}

export async function createTeamMember(
  prisma: PrismaClient,
  input: CreateTeamMemberInput,
): Promise<User> {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role ?? "AGENT",
      },
    });
    return toSafe(user);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ApiError(
        409,
        "EMAIL_TAKEN",
        "A team member with this email already exists.",
      );
    }
    throw err;
  }
}

export async function updateTeamMember(
  prisma: PrismaClient,
  id: number,
  input: UpdateTeamMemberInput,
): Promise<User> {
  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email.toLowerCase();
  if (input.role !== undefined) data.role = input.role;
  if (input.password !== undefined) data.passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.update({ where: { id }, data });
    return toSafe(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        throw new ApiError(404, "USER_NOT_FOUND", "User not found");
      }
      if (err.code === "P2002") {
        throw new ApiError(
          409,
          "EMAIL_TAKEN",
          "A team member with this email already exists.",
        );
      }
    }
    throw err;
  }
}

export async function deleteTeamMember(
  prisma: PrismaClient,
  id: number,
): Promise<void> {
  // Refuse to delete a user that still owns leads. Caller must reassign
  // first. Run as one transaction so the count and delete can't drift
  // (avoid TOCTOU if a lead gets assigned between the two queries).
  try {
    await prisma.$transaction(async (tx) => {
      const hasAssignedLeads = await tx.lead.count({
        where: { assignedTo: id },
        take: 1,
      });
      if (hasAssignedLeads > 0) {
        logger.warn("Refused to delete user with assigned leads", { userId: id });
        throw new ApiError(
          409,
          "USER_HAS_LEADS",
          "Cannot delete user with assigned leads. Reassign leads first.",
        );
      }
      await tx.user.delete({ where: { id } });
    });
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }
    throw err;
  }
}
