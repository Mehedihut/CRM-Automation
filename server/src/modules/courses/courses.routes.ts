import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
} from "./courses.schema";
import {
  createCourseController,
  deleteCourseController,
  getCourseController,
  listCoursesController,
  updateCourseController,
} from "./courses.controller";

const router = Router();

router.use(requireAuth);

// Active-only listing for non-admins. Admins can opt-in to inactive rows.
router.get("/", validate({ query: listCoursesQuerySchema }), listCoursesController);
router.get("/:id", getCourseController);
router.post(
  "/",
  requireRole("ADMIN"),
  validate({ body: createCourseSchema }),
  createCourseController,
);
router.patch(
  "/:id",
  requireRole("ADMIN"),
  validate({ body: updateCourseSchema }),
  updateCourseController,
);
router.delete("/:id", requireRole("ADMIN"), deleteCourseController);

export default router;
