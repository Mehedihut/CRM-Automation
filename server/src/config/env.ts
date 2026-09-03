import dotenv from "dotenv";
import path from "path";

// Load .env from the server root (one level above /src) regardless of cwd.
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function readString(name: string, fallback?: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return value;
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const nodeEnv = readString("NODE_ENV", "development") ?? "development";
const port = readNumber("PORT", 4000);
const clientOrigin = readString("CLIENT_ORIGIN", "http://localhost:5173") ?? "http://localhost:5173";
const databaseUrl = readString("DATABASE_URL");

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isDevelopment: nodeEnv === "development",
  port,
  clientOrigin,
  databaseUrl,
} as const;

export type Env = typeof env;
