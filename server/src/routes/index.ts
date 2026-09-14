import { Router } from "express";
import { health } from "../controllers/health.controller";
import authRoutes from "../modules/auth/auth.routes";
import leadRoutes from "../modules/leads/leads.routes";
import teamRoutes from "../modules/team/team.routes";
import callRoutes from "../modules/calls/calls.routes";
import whatsappRoutes from "../modules/whatsapp/whatsapp.routes";
import followUpRoutes from "../modules/followUps/followUps.routes";
import pukuAccessRoutes from "../modules/pukuAccess/pukuAccess.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import courseRoutes from "../modules/courses/courses.routes";
import interestRoutes from "../modules/leadCourseInterests/interests.routes";

const router = Router();

router.get("/health", health);
router.use("/auth", authRoutes);
router.use("/leads", leadRoutes);
router.use("/team", teamRoutes);
router.use("/follow-ups", followUpRoutes);
router.use("/puku-access", pukuAccessRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/courses", courseRoutes);
// These routers mount both nested + flat endpoints.
router.use(callRoutes);
router.use(whatsappRoutes);
router.use(interestRoutes);

export default router;
