import type { PrismaClient, AuditAction } from "@prisma/client";

export interface AuditEntry {
  action: AuditAction;
  entity?: string | null;
  actorId?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Write a single audit row. Callers wrap this in their own transaction when
 * the audit row must roll back if the underlying action fails — keeps the
 * audit trail consistent with the state changes it describes.
 */
export async function recordAudit(
  prisma: PrismaClient,
  entry: AuditEntry,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: entry.action,
      entity: entry.entity ?? null,
      actorId: entry.actorId ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
      metadata: (entry.metadata as object | null) ?? undefined,
    },
  });
}

export interface AuditListFilters {
  action?: AuditAction;
  entity?: string;
  actorId?: number;
  from?: Date;
  to?: Date;
  limit?: number;
  cursor?: number;
}
