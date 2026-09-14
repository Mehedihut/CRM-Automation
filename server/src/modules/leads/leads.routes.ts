import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import {
  assignLeadSchema,
  createLeadSchema,
  listLeadsQuerySchema,
  updateLeadSchema,
} from "./leads.schema";
import {
  assignLeadController,
  createLeadController,
  deleteLeadController,
  getLeadController,
  listLeadsController,
  updateLeadController,
} from "./leads.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate({ query: listLeadsQuerySchema }), listLeadsController);
router.get("/:id", getLeadController);
router.post("/", requireRole("ADMIN"), validate({ body: createLeadSchema }), createLeadController);
router.patch(
  "/:id",
  requireRole("ADMIN"),
  validate({ body: updateLeadSchema }),
  updateLeadController,
);
router.patch(
  "/:id/assign",
  requireRole("ADMIN"),
  validate({ body: assignLeadSchema }),
  assignLeadController,
);
router.delete("/:id", requireRole("ADMIN"), deleteLeadController);

export default router;
