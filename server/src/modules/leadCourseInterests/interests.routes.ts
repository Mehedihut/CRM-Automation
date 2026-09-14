import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import { setLeadInterestsSchema } from "./interests.schema";
import {
  getInterestsController,
  setInterestsController,
} from "./interests.controller";

const router = Router();

router.use(requireAuth);

// Nested under leads.
router.get("/leads/:leadId/course-interests", getInterestsController);
router.put(
  "/leads/:leadId/course-interests",
  validate({ body: setLeadInterestsSchema }),
  setInterestsController,
);

export default router;
