import { Router } from "express";
import * as ctrl from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);
router.get("/stats", ctrl.stats);

export default router;
