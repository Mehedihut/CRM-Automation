import { Router } from "express";
import * as ctrl from "../controllers/calls.controller";
import { validateCreateCall, validateLeadIdParam } from "../validators/calls.schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.post("/", validateCreateCall, ctrl.create);
router.get("/", ctrl.listAll);
router.get("/lead/:id", validateLeadIdParam, ctrl.listForLead);

export default router;
