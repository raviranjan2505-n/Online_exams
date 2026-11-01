import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role, User } from "../models/User";
import { HttpError } from "../utils/http";

interface TokenPayload {
  id: string;
  role: Role;
}

export function signToken(id: string, role: Role): string {
  return jwt.sign({ id, role }, env.jwtSecret, { expiresIn: "7d" });
}

/** Verifies the Bearer token and loads the user onto req.user. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new HttpError(401, "Not authenticated");

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    } catch {
      throw new HttpError(401, "Invalid or expired token");
    }

    const user = await User.findById(payload.id);
    if (!user) throw new HttpError(401, "Account no longer exists");
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole =
  (role: Role) => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) return next(new HttpError(403, "Forbidden"));
    next();
  };
