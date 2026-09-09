import { z } from "zod";
import { validate } from "../middleware/validate";

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const validateLogin = validate({ body: loginSchema });
