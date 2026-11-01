import crypto from "crypto";
import fs from "fs";
import multer from "multer";
import path from "path";

export const uploadDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowed: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

// Same idea as FileStorageService.java: random unique file name, saved to local disk.
export const uploadProfilePic = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + (allowed[file.mimetype] || "")),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowed[file.mimetype]) cb(null, true);
    else cb(new Error("Only JPG and PNG images are allowed"));
  },
}).single("profilePic");

/** Returns the web path stored in the DB, e.g. "/uploads/abc.jpg" */
export const toWebPath = (file?: Express.Multer.File) => (file ? `/uploads/${file.filename}` : null);
