import { Router } from "express";
import {
  forgotHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  resetHandler,
} from "../controllers/auth.controller";
import { validateForgot, validateLogin, validateReset } from "../validators/auth.schema";
import { requireAuth } from "../middleware/requireAuth";
import { authRateLimit } from "../middleware/rateLimit";

const router = Router();

// Public auth surface — protected against credential stuffing by IP-based
// rate limiting. The limiter counts every request hitting these routes
// regardless of which handler it eventually reaches.
router.post("/login", authRateLimit(), validateLogin, loginHandler);
router.post("/logout", authRateLimit(), logoutHandler);
router.post("/forgot", authRateLimit(), validateForgot, forgotHandler);
router.post("/reset", authRateLimit(), validateReset, resetHandler);
router.get("/me", requireAuth, meHandler);

export default router;
