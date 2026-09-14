import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import { logCallSchema } from "./calls.schema";
import {
  deleteCallController,
  listCallsController,
  logCallController,
} from "./calls.controller";

const router = Router();

router.use(requireAuth);

// Nested under leads
router.get("/leads/:leadId/calls", listCallsController);
router.post(
  "/leads/:leadId/calls",
  validate({ body: logCallSchema }),
  logCallController,
);

// Flat delete
router.delete("/calls/:id", deleteCallController);

export default router;
