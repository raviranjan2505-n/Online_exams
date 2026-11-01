import { NextFunction, Request, RequestHandler, Response } from "express";
import { Types } from "mongoose";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Wraps an async handler so rejected promises reach the error middleware (Express 4). */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Throws 404 for malformed ids so Mongoose never sees them. */
export function assertId(id: string, label = "Resource"): string {
  if (!Types.ObjectId.isValid(id)) throw new HttpError(404, `${label} not found`);
  return id;
}

export function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
