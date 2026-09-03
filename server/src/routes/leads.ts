import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/", async (req, res, next) => {
  try {
    const { name, phone, email, source, notes } = req.body;

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        source,
        notes,
      },
    });

    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(leads);
  } catch (error) {
    next(error);
  }
});

export default router;
