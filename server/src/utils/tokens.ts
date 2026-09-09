import { createHash, randomBytes } from "node:crypto";

/**
 * Generate a URL-safe random token to send in a password-reset email.
 * The raw value is what the user clicks; only its hash is stored in the DB.
 */
export function generateRawToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
