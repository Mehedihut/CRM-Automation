import { z } from "zod";
import { validate } from "../middleware/validate";

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const forgotSchema = z.object({
  email: z.string().email().max(200),
});

export const resetSchema = z.object({
  token: z.string().min(10).max(500),
  password: z.string().min(8).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotInput = z.infer<typeof forgotSchema>;
export type ResetInput = z.infer<typeof resetSchema>;

export const validateLogin = validate({ body: loginSchema });
export const validateForgot = validate({ body: forgotSchema });
export const validateReset = validate({ body: resetSchema });
