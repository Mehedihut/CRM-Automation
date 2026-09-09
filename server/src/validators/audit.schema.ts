import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { validate } from "../middleware/validate";

// Allowlist for query input. Unknown actions 400 out — never silently pass
// to Prisma (which would also reject them, but with a less clear message).
const auditActionEnum = z.nativeEnum(AuditAction);

export const listAuditQuerySchema = z.object({
  action: auditActionEnum.optional(),
  entity: z.string().min(1).max(200).optional(),
  actorId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.coerce.number().int().positive().optional(),
});

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;

export const validateListAudit = validate({ query: listAuditQuerySchema });
