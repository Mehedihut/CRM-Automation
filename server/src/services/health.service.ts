import { env } from "../config/env";

export interface HealthStatus {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
  environment: string;
  database: {
    configured: boolean;
    reachable: boolean;
    error?: string;
  };
}

export function getHealthStatus(dbError?: string): HealthStatus {
  return {
    status: dbError ? "degraded" : "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    database: {
      configured: Boolean(env.databaseUrl),
      reachable: !dbError,
      error: dbError,
    },
  };
}
