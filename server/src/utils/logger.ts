import { env } from "../config/env";
import type { Request } from "express";

type Level = "info" | "warn" | "error" | "debug";

interface RequestLike {
  id?: string;
}

/**
 * Anything passed as the second arg to a log call. Either a plain object of
 * metadata, a request (whose `id` is lifted out for line-level tagging), or
 * undefined.
 */
type LogArg = Record<string, unknown> | RequestLike | Request | undefined;

function format(
  level: Level,
  message: string,
  meta: Record<string, unknown> | undefined,
  requestId: string | undefined,
): string {
  const ts = new Date().toISOString();
  const reqPart = requestId ? ` [req=${requestId}]` : "";
  const base = `[${ts}] [${level.toUpperCase()}]${reqPart} ${message}`;
  if (!meta || Object.keys(meta).length === 0) return base;
  try {
    return `${base} ${JSON.stringify(meta)}`;
  } catch {
    return `${base} [unserializable meta]`;
  }
}

function normalize(arg: LogArg): { id?: string; rest: Record<string, unknown> } {
  if (!arg) return { rest: {} };
  const maybeReq = arg as RequestLike;
  if (typeof maybeReq.id === "string") {
    // `id` is consumed for line tagging; everything else is meta.
    const copy = { ...(arg as Record<string, unknown>) };
    delete (copy as { id?: string }).id;
    return { id: maybeReq.id, rest: copy };
  }
  return { rest: arg as Record<string, unknown> };
}

function write(
  level: Level,
  message: string,
  arg: LogArg,
  stream: "stdout" | "stderr",
): void {
  const { id, rest } = normalize(arg);
  const meta = Object.keys(rest).length > 0 ? rest : undefined;
  const line = format(level, message, meta, id);
  // eslint-disable-next-line no-console
  if (stream === "stderr") console.error(line);
  else console.log(line);
}

export const logger = {
  info(message: string, arg?: LogArg): void {
    write("info", message, arg, "stdout");
  },
  warn(message: string, arg?: LogArg): void {
    write("warn", message, arg, "stderr");
  },
  error(message: string, arg?: LogArg): void {
    write("error", message, arg, "stderr");
  },
  debug(message: string, arg?: LogArg): void {
    if (!env.isDevelopment) return;
    write("debug", message, arg, "stdout");
  },
};
