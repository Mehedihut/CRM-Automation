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
const isProduction = nodeEnv === "production";
const port = readNumber("PORT", 4000);
const clientOrigin = readString("CLIENT_ORIGIN", "http://localhost:5173") ?? "http://localhost:5173";
const databaseUrl = readString("DATABASE_URL");

// Auth / cookies. The dev fallback is intentionally weak so a misconfigured
// production deploy fails loudly at boot rather than running with a guessable
// signing key.
const DEV_INSECURE_JWT_SECRET = "dev-insecure-jwt-secret-change-me";
const jwtSecretRaw = readString("JWT_SECRET", DEV_INSECURE_JWT_SECRET) ?? DEV_INSECURE_JWT_SECRET;
if (isProduction && jwtSecretRaw === DEV_INSECURE_JWT_SECRET) {
  throw new Error(
    "Refusing to boot in production with the development JWT_SECRET fallback. " +
      "Set the JWT_SECRET environment variable to a strong random value (e.g. `openssl rand -hex 32`).",
  );
}
const jwtSecret = jwtSecretRaw;
const jwtExpiresIn = readString("JWT_EXPIRES_IN", "7d") ?? "7d";
const cookieDomain = readString("COOKIE_DOMAIN");
const bcryptRounds = readNumber("BCRYPT_ROUNDS", 10);

// Same fail-loud rule for the database: production needs a real URL.
if (isProduction && !databaseUrl) {
  throw new Error(
    "Refusing to boot in production without DATABASE_URL. " +
      "Set the DATABASE_URL environment variable to your Postgres connection string.",
  );
}

// Optional integration credentials (consumed by stubs in src/integrations/).
const metaVerifyToken = readString("META_VERIFY_TOKEN");
const metaAppSecret = readString("META_APP_SECRET");
const whatsappApiToken = readString("WHATSAPP_API_TOKEN");
const whatsappPhoneId = readString("WHATSAPP_PHONE_ID");
const pukuApiBaseUrl = readString("PUKU_API_BASE_URL");
const pukuApiToken = readString("PUKU_API_TOKEN");

// SMTP for password-reset emails. When SMTP_HOST is unset, sendPasswordReset
// falls back to logging the link to the server console (dev mode only).
const smtpHost = readString("SMTP_HOST");
const smtpPort = readNumber("SMTP_PORT", 587);
const smtpUser = readString("SMTP_USER");
const smtpPassword = readString("SMTP_PASSWORD");
const smtpFrom = readString("SMTP_FROM", "CRM-Automation <no-reply@example.com>") ??
  "CRM-Automation <no-reply@example.com>";
const appBaseUrl = readString("APP_BASE_URL", "http://localhost:5173") ?? "http://localhost:5173";

export const env = {
  nodeEnv,
  isProduction,
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
  smtp: {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    password: smtpPassword,
    from: smtpFrom,
    enabled: Boolean(smtpHost && smtpUser && smtpPassword),
  },
  appBaseUrl,
} as const;

export type Env = typeof env;
