import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import {
  scheduleFollowUpSchema,
  updateFollowUpSchema,
} from "./followUps.schema";
import {
  deleteFollowUpController,
  listFollowUpsController,
  scheduleFollowUpController,
  updateFollowUpController,
} from "./followUps.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listFollowUpsController);
router.post(
  "/leads/:leadId/follow-ups",
  validate({ body: scheduleFollowUpSchema }),
  scheduleFollowUpController,
);
router.patch(
  "/:id",
  validate({ body: updateFollowUpSchema }),
  updateFollowUpController,
);
router.delete("/:id", deleteFollowUpController);

export default router;
