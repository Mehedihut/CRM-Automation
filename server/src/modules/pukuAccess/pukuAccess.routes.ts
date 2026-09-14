import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import {
  decidePukuSchema,
  requestPukuSchema,
} from "./pukuAccess.schema";
import {
  createRequestController,
  decideRequestController,
  listByLeadController,
  listRequestsController,
} from "./pukuAccess.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listRequestsController);
router.get("/leads/:leadId/puku-access", listByLeadController);
router.post(
  "/leads/:leadId/puku-access",
  validate({ body: requestPukuSchema }),
  createRequestController,
);
router.patch(
  "/:id",
  requireRole("ADMIN"),
  validate({ body: decidePukuSchema }),
  decideRequestController,
);

export default router;
