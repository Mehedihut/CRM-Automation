import { Router } from "express";
import * as ctrl from "../controllers/followups.controller";
import {
  validateCreateFollowUp,
  validateFollowUpIdParam,
  validateListFollowUps,
  validateUpdateFollowUp,
} from "../validators/followups.schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth);

router.post("/", validateCreateFollowUp, ctrl.create);
router.get("/", validateListFollowUps, ctrl.list);
router.get("/:id", validateFollowUpIdParam, ctrl.getOne);
router.patch("/:id", validateUpdateFollowUp, ctrl.update);
router.delete("/:id", validateFollowUpIdParam, ctrl.remove);

export default router;
