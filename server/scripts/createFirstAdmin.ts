/**
 * CLI: create the first admin user. Idempotent — refuses if the email exists.
 *
 * Usage:
 *   npm --prefix server run admin:create -- --email a@x.com --password secret --name "Admin"
 *
 * Flags:
 *   --email     (required) Admin email
 *   --password  (required) Admin password (plaintext; will be hashed)
 *   --name      (optional) Display name. Defaults to "Admin".
 *   --role      (optional) ADMIN (default) | AGENT
 */
import { getPrismaClient } from "../src/config/prisma";
import { hashPassword } from "../src/utils/password";
import { logger } from "../src/utils/logger";

interface Args {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "AGENT";
}

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--email") out.email = value, i++;
    else if (key === "--password") out.password = value, i++;
    else if (key === "--name") out.name = value, i++;
    else if (key === "--role") {
      if (value !== "ADMIN" && value !== "AGENT") {
        throw new Error(`--role must be ADMIN or AGENT, got: ${value}`);
      }
      out.role = value, i++;
    }
  }
  if (!out.email) throw new Error("--email is required");
  if (!out.password) throw new Error("--password is required");
  if (out.password.length < 8) throw new Error("--password must be at least 8 characters");
  return {
    email: out.email,
    password: out.password,
    name: out.name ?? "Admin",
    role: out.role ?? "ADMIN",
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const prisma = getPrismaClient();
  const existing = await prisma.user.findUnique({ where: { email: args.email.toLowerCase() } });
  if (existing) {
    logger.warn(`User with email ${args.email} already exists (id=${existing.id}). Aborting.`);
    process.exit(1);
  }
  const passwordHash = await hashPassword(args.password);
  const user = await prisma.user.create({
    data: {
      name: args.name,
      email: args.email.toLowerCase(),
      passwordHash,
      role: args.role,
    },
  });
  logger.info(`User created: id=${user.id} email=${user.email} role=${user.role}`);
  process.exit(0);
}

main().catch((err) => {
  logger.error("admin:create failed", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
