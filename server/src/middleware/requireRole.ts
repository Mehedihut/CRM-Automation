import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized("Not authenticated");
    }
    if (!allowed.includes(req.user.role)) {
      throw ApiError.forbidden(`Requires role: ${allowed.join(" or ")}`);
    }
    next();
  };
}
