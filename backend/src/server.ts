import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";
import { uploadDir } from "./middleware/upload";
import { User } from "./models/User";
import routes from "./routes";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function seedAdmin() {
  const exists = await User.exists({ role: "ADMIN" });
  if (exists) return;
  await User.create({
    username: env.adminUsername,
    password: await bcrypt.hash(env.adminPassword, 10),
    fullName: "Administrator",
    role: "ADMIN",
  });
  console.log(`Default admin created -> username: ${env.adminUsername}`);
}

async function main() {
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
  await seedAdmin();

  const app = express();
  app.use(cors({ origin: env.clientUrl }));
  app.use(express.json());
  app.use("/uploads", express.static(uploadDir));
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", routes);
  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.port, () => console.log(`API running on http://localhost:${env.port}`));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
