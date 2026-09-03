import { createApp, logStartupBanner } from "./app";
import { env } from "./config/env";
import { disconnectPrisma } from "./config/prisma";
import { logger } from "./utils/logger";

const app = createApp();
const port = env.port;

const server = app.listen(port, () => {
  logStartupBanner(port);
});

// Graceful shutdown — don't lose DB connections on Ctrl+C / SIGTERM.
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    try {
      await disconnectPrisma();
    } catch (err) {
      logger.warn("Error while disconnecting Prisma", { err });
    }
    process.exit(0);
  });
  // Hard exit if shutdown takes too long.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { err });
});
