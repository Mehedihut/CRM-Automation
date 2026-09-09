import { Router } from "express";
import * as ctrl from "../controllers/audit.controller";
import { validateListAudit } from "../validators/audit.schema";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));
router.get("/", validateListAudit, ctrl.list);

export default router;
