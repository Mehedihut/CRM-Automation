import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createCourse,
  getCourseOrThrow,
  listCourses,
  softDeleteCourse,
  updateCourse,
} from "./courses.service";
import type {
  CreateCourseInput,
  UpdateCourseInput,
} from "./courses.schema";

export const listCoursesController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const wantsAll =
      req.user?.role === "ADMIN" &&
      (req.query as Record<string, unknown>).includeInactive === true;
    const items = await listCourses({ includeInactive: wantsAll });
    res.status(200).json({ success: true, data: { items } });
  },
);

export const getCourseController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const course = await getCourseOrThrow(req.params.id);
    res.status(200).json({ success: true, data: course });
  },
);

export const createCourseController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateCourseInput;
    const created = await createCourse(body);
    res.status(201).json({ success: true, data: created });
  },
);

export const updateCourseController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateCourseInput;
    const updated = await updateCourse(req.params.id, body);
    res.status(200).json({ success: true, data: updated });
  },
);

export const deleteCourseController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await softDeleteCourse(req.params.id);
    res.status(200).json({ success: true, data: { ok: true } });
  },
);
