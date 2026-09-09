import { PrismaClient, Prisma, type PukuAccessRequest } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { pukuProvisionAccess } from "../integrations/puku";
import type {
  CreatePukuRequestInput,
  ListPukuRequestsQuery,
  UpdatePukuRequestInput,
} from "../validators/puku.schema";

const deciderSelect = { id: true, name: true, email: true } as const;
const include = { decidedBy: { select: deciderSelect } } as const;

export async function listPukuRequests(
  prisma: PrismaClient,
  filters: ListPukuRequestsQuery,
): Promise<PukuAccessRequest[]> {
  const where: Prisma.PukuAccessRequestWhereInput = {};
  if (filters.status) where.status = filters.status;
  return prisma.pukuAccessRequest.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPukuRequest(
  prisma: PrismaClient,
  id: number,
): Promise<PukuAccessRequest> {
  const req = await prisma.pukuAccessRequest.findUnique({ where: { id }, include });
  if (!req) {
    throw new ApiError(404, "PUKU_REQUEST_NOT_FOUND", "Puku request not found");
  }
  return req;
}

export async function createPukuRequest(
  prisma: PrismaClient,
  input: CreatePukuRequestInput,
): Promise<PukuAccessRequest> {
  return prisma.pukuAccessRequest.create({
    data: {
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      requesterPhone: input.requesterPhone,
      requestedScope: input.requestedScope,
      reason: input.reason,
    },
    include,
  });
}

export async function updatePukuRequest(
  prisma: PrismaClient,
  id: number,
  input: UpdatePukuRequestInput,
): Promise<PukuAccessRequest> {
  const existing = await prisma.pukuAccessRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "PUKU_REQUEST_NOT_FOUND", "Puku request not found");
  }
  if (existing.status !== "PENDING") {
    throw new ApiError(
      409,
      "PUKU_REQUEST_LOCKED",
      "Cannot edit a Puku request after it has been decided.",
    );
  }
  return prisma.pukuAccessRequest.update({
    where: { id },
    data: input,
    include,
  });
}

export async function deletePukuRequest(
  prisma: PrismaClient,
  id: number,
): Promise<void> {
  try {
    await prisma.pukuAccessRequest.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new ApiError(404, "PUKU_REQUEST_NOT_FOUND", "Puku request not found");
    }
    throw err;
  }
}

export async function approve(
  prisma: PrismaClient,
  id: number,
  deciderId: number,
  note: string | undefined,
): Promise<PukuAccessRequest> {
  const existing = await prisma.pukuAccessRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "PUKU_REQUEST_NOT_FOUND", "Puku request not found");
  }
  if (existing.status !== "PENDING") {
    throw new ApiError(
      409,
      "PUKU_REQUEST_ALREADY_DECIDED",
      `Request already ${existing.status.toLowerCase()}.`,
    );
  }

  // INTEGRATION TODO — call Puku API; current stub throws 501.
  await pukuProvisionAccess({ requestId: id, scope: existing.requestedScope });

  // unreachable in current implementation; stub throws.
  const updated = await prisma.pukuAccessRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      decidedById: deciderId,
      decidedAt: new Date(),
      decisionNote: note,
    },
    include,
  });
  logger.info("Puku request approved", { id, deciderId });
  return updated;
}

export async function reject(
  prisma: PrismaClient,
  id: number,
  deciderId: number,
  note: string | undefined,
): Promise<PukuAccessRequest> {
  const existing = await prisma.pukuAccessRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "PUKU_REQUEST_NOT_FOUND", "Puku request not found");
  }
  if (existing.status !== "PENDING") {
    throw new ApiError(
      409,
      "PUKU_REQUEST_ALREADY_DECIDED",
      `Request already ${existing.status.toLowerCase()}.`,
    );
  }
  const updated = await prisma.pukuAccessRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      decidedById: deciderId,
      decidedAt: new Date(),
      decisionNote: note,
    },
    include,
  });
  logger.info("Puku request rejected", { id, deciderId });
  return updated;
}
