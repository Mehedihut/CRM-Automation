// Vercel serverless entry. The existing `server/src/server.ts` boots a
// long-lived Node process for `npm run dev`; Vercel calls this handler
// per request. createApp() is cheap on warm starts (Express + middleware
// setup) and we warm the Prisma client once per cold start so the first
// request doesn't pay the connection-pool init cost.
import { createApp } from "../src/app";
import { getPrismaClient } from "../src/config/prisma";

// Warm Prisma lazily — getPrismaClient throws when DATABASE_URL is missing,
// which Vercel will surface as a 500 on the first request. /api/healthz
// will report the same state.
try {
  getPrismaClient();
} catch {
  // intentional: serverless routes still mount and /api/healthz still
  // responds with the configuration error in the body.
}

export default createApp();
