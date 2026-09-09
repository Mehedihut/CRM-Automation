import { Router } from "express";
import * as ctrl from "../controllers/leads.controller";
import {
  validateCreateLead,
  validateLeadIdParam,
  validateListLeads,
  validateUpdateLead,
} from "../validators/leads.schema";
import { validateAssignLead } from "../validators/team.schema";

const router = Router();

router.post("/", validateCreateLead, ctrl.create);
router.get("/", validateListLeads, ctrl.list);
router.get("/:id", validateLeadIdParam, ctrl.getOne);
router.patch("/:id", validateUpdateLead, ctrl.update);
router.delete("/:id", validateLeadIdParam, ctrl.remove);
router.post("/:id/assign", validateAssignLead, ctrl.assign);

export default router;
