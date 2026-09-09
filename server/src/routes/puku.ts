import { Router } from "express";
import * as ctrl from "../controllers/puku.controller";
import {
  validateCreatePuku,
  validateDecision,
  validateListPuku,
  validatePukuIdParam,
  validateUpdatePuku,
} from "../validators/puku.schema";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();
router.use(requireAuth);

// Reads + create: any authed user.
router.get("/", validateListPuku, ctrl.list);
router.post("/", validateCreatePuku, ctrl.create);
router.get("/:id", validatePukuIdParam, ctrl.getOne);

// Edit/delete + decisions: admin only.
router.patch("/:id", requireRole("ADMIN"), validateUpdatePuku, ctrl.update);
router.delete("/:id", requireRole("ADMIN"), validatePukuIdParam, ctrl.remove);
router.post("/:id/approve", requireRole("ADMIN"), validateDecision, ctrl.approveHandler);
router.post("/:id/reject", requireRole("ADMIN"), validateDecision, ctrl.rejectHandler);

export default router;
