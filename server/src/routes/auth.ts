import { Router } from "express";
import { loginHandler, logoutHandler, meHandler } from "../controllers/auth.controller";
import { validateLogin } from "../validators/auth.schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/login", validateLogin, loginHandler);
router.post("/logout", logoutHandler);
router.get("/me", requireAuth, meHandler);

export default router;
