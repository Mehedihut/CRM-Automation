import { Router } from "express";
import { loginHandler, logoutHandler, meHandler } from "../controllers/auth.controller";
import { validateLogin } from "../validators/auth.schema";
import { requireAuth } from "../middleware/requireAuth";
import { authRateLimit } from "../middleware/rateLimit";

const router = Router();

// Public auth surface — protected against credential stuffing by IP-based
// rate limiting. The limiter counts every request hitting these routes
// regardless of which handler it eventually reaches.
router.post("/login", authRateLimit(), validateLogin, loginHandler);
router.post("/logout", authRateLimit(), logoutHandler);
router.get("/me", requireAuth, meHandler);

export default router;
