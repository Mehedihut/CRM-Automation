import { Router } from "express";
import * as ctrl from "../controllers/whatsapp.controller";
import { validateCreateWhatsApp, validateLeadIdParam } from "../validators/whatsapp.schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth);

router.post("/:id", validateCreateWhatsApp, ctrl.create);
router.get("/:id", validateLeadIdParam, ctrl.listForLead);
router.post("/send/:id", validateLeadIdParam, ctrl.sendStub);

export default router;
