import { Router } from "express";
import { health } from "../controllers/health.controller";
import leadRoutes from "./leads";
import teamRoutes from "./team";
import authRoutes from "./auth";
import callRoutes from "./calls";
import whatsappRoutes from "./whatsapp";
import followUpRoutes from "./followups";
import pukuRoutes from "./puku";
import dashboardRoutes from "./dashboard";

// All API routes mounted under /api. Add cross-cutting middleware (auth,
// rate-limit) here.
const router = Router();

router.get("/health", health);
router.use("/auth", authRoutes);
router.use("/leads", leadRoutes);
router.use("/team", teamRoutes);
router.use("/calls", callRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/follow-ups", followUpRoutes);
router.use("/puku-access", pukuRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
