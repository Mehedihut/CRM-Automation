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

// Auth / cookies
const jwtSecret = readString("JWT_SECRET", "dev-insecure-jwt-secret-change-me");
const jwtExpiresIn = readString("JWT_EXPIRES_IN", "7d") ?? "7d";
const cookieDomain = readString("COOKIE_DOMAIN");
const bcryptRounds = readNumber("BCRYPT_ROUNDS", 10);

// Optional integration credentials (consumed by stubs in src/integrations/).
const metaVerifyToken = readString("META_VERIFY_TOKEN");
const metaAppSecret = readString("META_APP_SECRET");
const whatsappApiToken = readString("WHATSAPP_API_TOKEN");
const whatsappPhoneId = readString("WHATSAPP_PHONE_ID");
const pukuApiBaseUrl = readString("PUKU_API_BASE_URL");
const pukuApiToken = readString("PUKU_API_TOKEN");

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isDevelopment: nodeEnv === "development",
  port,
  clientOrigin,
  databaseUrl,
  jwtSecret,
  jwtExpiresIn,
  cookieDomain,
  bcryptRounds,
  meta: { verifyToken: metaVerifyToken, appSecret: metaAppSecret },
  whatsapp: { apiToken: whatsappApiToken, phoneId: whatsappPhoneId },
  puku: { baseUrl: pukuApiBaseUrl, token: pukuApiToken },
} as const;

export type Env = typeof env;
