import { Prisma } from "@prisma/client";
import { ApiError } from "./ApiError";

/**
 * Map a Prisma known-request error to a domain ApiError, or rethrow.
 * Use in `catch` blocks after `prisma.<model>.update/delete/create`.
 */
export function mapPrismaError(
  err: unknown,
  mapping: Partial<Record<string, () => never>>,
): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const handler = mapping[err.code];
    if (handler) handler();
  }
  throw err;
}
