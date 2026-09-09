import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "X-Request-Id";

declare module "express-serve-static-core" {
  interface Request {
    id?: string;
  }
}

/**
 * Attaches a stable request id to `req.id` and echoes it back to the client
 * via the `X-Request-Id` response header. If the client already sent a
 * request id (e.g. from an upstream gateway) we honour it.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
