import { HydratedDocument } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user?: HydratedDocument<any> & {
        username: string;
        password: string;
        fullName?: string | null;
        mobileNumber?: string | null;
        profilePicUrl?: string | null;
        role: "ADMIN" | "STUDENT";
      };
    }
  }
}

export {};
