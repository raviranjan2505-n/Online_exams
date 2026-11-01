import { Schema, model, InferSchemaType } from "mongoose";

export type Role = "ADMIN" | "STUDENT";

const userSchema = new Schema(
  {
    // For students the username is their email (same as the Java app)
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, trim: true, default: "" },
    mobileNumber: { type: String, trim: true, default: "" },
    profilePicUrl: { type: String, default: null },
    role: { type: String, enum: ["ADMIN", "STUDENT"], required: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: import("mongoose").Types.ObjectId };
export const User = model("User", userSchema);

export function publicUser(u: {
  _id: unknown;
  username: string;
  fullName?: string | null;
  mobileNumber?: string | null;
  profilePicUrl?: string | null;
  role: string;
}) {
  return {
    id: String(u._id),
    username: u.username,
    fullName: u.fullName || "",
    mobileNumber: u.mobileNumber || "",
    profilePicUrl: u.profilePicUrl || null,
    role: u.role,
  };
}
