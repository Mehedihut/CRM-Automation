import { Router } from "express";
import { health } from "../controllers/health.controller";
import leadRoutes from "./leads";

const router = Router();

router.get("/health", health);
router.use("/leads", leadRoutes);

export default router;
