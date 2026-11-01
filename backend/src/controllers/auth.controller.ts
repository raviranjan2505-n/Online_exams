import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { signToken } from "../middleware/auth";
import { toWebPath, uploadDir } from "../middleware/upload";
import { publicUser, User } from "../models/User";
import { asyncHandler, HttpError, str } from "../utils/http";

function discardUpload(file?: Express.Multer.File) {
  if (file) fs.unlink(path.join(uploadDir, file.filename), () => undefined);
}

// POST /api/auth/register  (multipart/form-data)  -- students only, like UserServiceImpl.saveStudent
export const register = asyncHandler(async (req: Request, res: Response) => {
  const username = str(req.body.username).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const fullName = str(req.body.fullName);
  const mobileNumber = str(req.body.mobileNumber);

  try {
    if (!username || !/^\S+@\S+\.\S+$/.test(username)) throw new HttpError(400, "A valid email is required");
    if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters");
    if (await User.exists({ username })) throw new HttpError(409, "An account already exists with that email.");
  } catch (err) {
    discardUpload(req.file);
    throw err;
  }

  await User.create({
    username,
    password: await bcrypt.hash(password, 10),
    fullName,
    mobileNumber,
    profilePicUrl: toWebPath(req.file),
    role: "STUDENT",
  });

  res.status(201).json({ message: "Registration successful" });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const username = str(req.body.username).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, "Invalid username or password");
  }

  res.json({ token: signToken(String(user._id), user.role), user: publicUser(user) });
});

// GET /api/auth/me
export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: publicUser(req.user!) });
});
