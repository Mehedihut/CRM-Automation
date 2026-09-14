import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import type {
  CreateCourseInput,
  UpdateCourseInput,
} from "./courses.schema";

export interface CourseDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toDTO(c: {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CourseDTO {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function listCourses(opts: { includeInactive: boolean }) {
  const items = await prisma.course.findMany({
    where: opts.includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
  return items.map(toDTO);
}

export async function getCourseOrThrow(id: string): Promise<CourseDTO> {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw ApiError.notFound("Course not found");
  return toDTO(course);
}

export async function createCourse(input: CreateCourseInput): Promise<CourseDTO> {
  const existing = await prisma.course.findUnique({
    where: { name: input.name },
  });
  if (existing) throw ApiError.conflict("A course with that name already exists");

  const created = await prisma.course.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
    },
  });
  return toDTO(created);
}

export async function updateCourse(
  id: string,
  input: UpdateCourseInput,
): Promise<CourseDTO> {
  try {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Course not found");

    if (input.name && input.name !== existing.name) {
      const dup = await prisma.course.findUnique({ where: { name: input.name } });
      if (dup) throw ApiError.conflict("A course with that name already exists");
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description ?? null }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    return toDTO(updated);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.notFound("Course not found");
  }
}

export async function softDeleteCourse(id: string): Promise<void> {
  try {
    await prisma.course.update({ where: { id }, data: { isActive: false } });
  } catch {
    throw ApiError.notFound("Course not found");
  }
}
