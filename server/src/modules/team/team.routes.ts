import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import {
  createTeamMemberSchema,
  updateTeamMemberSchema,
} from "./team.schema";
import {
  createTeamMemberController,
  deleteTeamMemberController,
  listAgentsController,
  listTeamController,
  updateTeamMemberController,
} from "./team.controller";

const router = Router();

router.use(requireAuth);

// /agents is open to any authenticated user (needed by LeadDetail assignment).
router.get("/agents", listAgentsController);

router.get("/", requireRole("ADMIN"), listTeamController);
router.post(
  "/",
  requireRole("ADMIN"),
  validate({ body: createTeamMemberSchema }),
  createTeamMemberController,
);
router.patch(
  "/:id",
  requireRole("ADMIN"),
  validate({ body: updateTeamMemberSchema }),
  updateTeamMemberController,
);
router.delete("/:id", requireRole("ADMIN"), deleteTeamMemberController);

export default router;
