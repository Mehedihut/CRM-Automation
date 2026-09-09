import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import apiRouter from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

export function createApp(): Application {
  const app = express();

  // Security & basics
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Logging — concise in dev, combined in prod.
  if (env.isDevelopment) {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Mount API under /api
  app.use("/api", apiRouter);

  // Root → friendly JSON for manual probing.
  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: "CRM-Automation API",
        version: "0.1.0",
        docs: "/api/health",
      },
    });
  });

  // 404 + error handlers (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function logStartupBanner(port: number): void {
  logger.info(`CRM-Automation API listening on port ${port} (env: ${env.nodeEnv})`);
  if (!env.databaseUrl) {
    logger.warn(
      "DATABASE_URL is not set. The server will start, but any DB-dependent route will return a configuration error. Copy server/.env.example to server/.env to configure it.",
    );
  }
}
