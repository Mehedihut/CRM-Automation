import { Router } from "express";
import * as ctrl from "../controllers/team.controller";
import {
  validateCreateTeam,
  validateIdParam,
  validateUpdateTeam,
} from "../validators/team.schema";

const router = Router();

router.post("/", validateCreateTeam, ctrl.create);
router.get("/", ctrl.list);
router.get("/:id", validateIdParam, ctrl.getOne);
router.patch("/:id", validateUpdateTeam, ctrl.update);
router.delete("/:id", validateIdParam, ctrl.remove);

export default router;
