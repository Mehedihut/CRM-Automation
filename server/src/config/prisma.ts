import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// We deliberately do NOT instantiate PrismaClient at module load when the
// database URL is missing — we want a graceful, explicit configuration error
// instead of a noisy Prisma init crash on boot.

let _client: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Copy server/.env.example to server/.env and set DATABASE_URL, then restart the server.",
    );
  }
  if (!_client) {
    _client = new PrismaClient({
      log: env.isDevelopment ? ["warn", "error"] : ["error"],
    });
  }
  return _client;
}

export async function disconnectPrisma(): Promise<void> {
  if (_client) {
    await _client.$disconnect();
    _client = null;
  }
}
