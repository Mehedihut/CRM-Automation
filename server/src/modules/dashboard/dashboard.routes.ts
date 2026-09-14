import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { getStatsController } from "./dashboard.controller";

const router = Router();

router.use(requireAuth);

router.get("/stats", getStatsController);

export default router;
