import { Router } from "express";
import { health } from "../controllers/health.controller";

const router = Router();

router.get("/health", health);
// Future: router.use("/auth", authRoutes);
// Future: router.use("/leads", leadRoutes);
// Future: router.use("/team", teamRoutes);
// Future: router.use("/whatsapp", whatsappRoutes);
// Future: router.use("/follow-ups", followUpRoutes);
// Future: router.use("/puku-access", pukuAccessRoutes);
// Future: router.use("/dashboard", dashboardRoutes);

export default router;
