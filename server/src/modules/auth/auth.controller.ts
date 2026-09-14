import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AUTH_COOKIE_NAME, jwtConfig } from "../../utils/jwt";
import { getUserById, login } from "./auth.service";
import type { LoginInput } from "./auth.schema";

export const loginController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as LoginInput;
    const result = await login(email, password);
    res.cookie(AUTH_COOKIE_NAME, result.token, jwtConfig.cookieOptions);
    res.status(200).json({ success: true, data: result });
  },
);

export const logoutController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    res.status(200).json({ success: true, data: { ok: true } });
  },
);

export const meController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await getUserById(req.user.sub);
  res.status(200).json({ success: true, data: { user } });
});
