import type { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

/**
 * Generic Zod-backed validator middleware.
 * Usage:
 *   router.post("/x", validate({ body: someSchema }), handler)
 */
export function validate(schemas: Partial<Record<Source, ZodSchema>>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      for (const source of ["body", "query", "params"] as const) {
        const schema = schemas[source];
        if (!schema) continue;
        const parsed = schema.parse(req[source]);
        // Replace with parsed (and coerced) value so handlers see clean data.
        // We assign to a writable property; req.query is read-only in Express 5
        // but in Express 4 we can mutate. We do a safe overwrite here.
        (req as unknown as Record<Source, unknown>)[source] = parsed;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
