import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import apiRouter from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { requestId } from "./middleware/requestId";
import { healthz } from "./controllers/health.controller";

export function createApp(): Application {
  const app = express();

  // Trust the first proxy hop (Vercel/CloudFront/load balancers) so
  // express-rate-limit + req.ip see the real client IP, not the proxy.
  app.set("trust proxy", 1);

  // Per-request id, set before anything that might log so the id appears in
  // every line emitted while handling this request.
  app.use(requestId);

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

  // Logging — concise in dev, combined in prod. Tag every line with the
  // request id so a 5xx is traceable end to end.
  morgan.token("id", (req: Request) => (req.id ?? "-"));
  const morganFormat = env.isDevelopment
    ? ":method :url :status :response-time[0]ms req=:id"
    : ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" req=:id';
  app.use(morgan(morganFormat));

  // Liveness + DB-readiness probe. Public. Does not require auth.
  app.use("/api", apiRouter);
  app.get("/api/healthz", healthz);

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
