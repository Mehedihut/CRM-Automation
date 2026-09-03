import { env } from "../config/env";

type Level = "info" | "warn" | "error" | "debug";

function format(level: Level, message: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (!meta || Object.keys(meta).length === 0) return base;
  try {
    return `${base} ${JSON.stringify(meta)}`;
  } catch {
    return `${base} [unserializable meta]`;
  }
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(format("info", message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.warn(format("warn", message, meta));
  },
  error(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.error(format("error", message, meta));
  },
  debug(message: string, meta?: Record<string, unknown>): void {
    if (env.isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(format("debug", message, meta));
    }
  },
};
