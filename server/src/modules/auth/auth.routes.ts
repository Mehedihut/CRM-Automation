import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import { loginSchema } from "./auth.schema";
import { loginController, logoutController, meController } from "./auth.controller";

const router = Router();

router.post("/login", validate({ body: loginSchema }), loginController);
router.post("/logout", logoutController);
router.get("/me", requireAuth, meController);

export default router;
