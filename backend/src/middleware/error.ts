import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HttpError } from "../utils/http";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "Route not found"));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err instanceof multer.MulterError) return res.status(400).json({ message: err.message });

  const e = err as { name?: string; code?: number; message?: string; errors?: Record<string, { message: string }> };
  if (e?.name === "ValidationError" && e.errors) {
    return res.status(400).json({ message: Object.values(e.errors).map((x) => x.message).join(", ") });
  }
  if (e?.code === 11000) return res.status(409).json({ message: "Duplicate entry" });
  if (e?.message === "Only JPG and PNG images are allowed") return res.status(400).json({ message: e.message });

  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
}
