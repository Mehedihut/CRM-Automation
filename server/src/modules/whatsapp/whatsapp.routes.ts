import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import { logWhatsappSchema } from "./whatsapp.schema";
import {
  deleteMessageController,
  listMessagesController,
  logMessageController,
} from "./whatsapp.controller";

const router = Router();

router.use(requireAuth);

router.get("/leads/:leadId/whatsapp", listMessagesController);
router.post(
  "/leads/:leadId/whatsapp",
  validate({ body: logWhatsappSchema }),
  logMessageController,
);

router.delete("/whatsapp/:id", deleteMessageController);

export default router;
