import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

/**
 * Rate-limiter for the auth surface (login + forgot + reset).
 *
 * 5 attempts per 15 minutes per IP. With `trust proxy = 1` set in app.ts
 * (one hop, e.g. Vercel's edge) `req.ip` reflects the real client rather
 * than the proxy.
 *
 * We translate the library's default `429` into our central ApiError so the
 * error envelope stays consistent across the API.
 */
export function authRateLimit(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, _res, next) => {
      logger.warn("Auth rate limit hit", { ip: req.ip, path: req.path });
      next(ApiError.tooManyRequests("Too many auth attempts. Please wait and try again."));
    },
  });
}
