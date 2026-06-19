import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createAuth } from "./config/auth.js";
import { toNodeHandler } from "better-auth/node";
import sessionMiddleware from "./middleware/session.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import routes from "./routes/index.js";
import { handleWebhook } from "./webhook.js";
import seedAdmin from "./seeds/admin.js";
import User from "./models/User.js";

async function start() {
  const conn = await connectDB();
  const db = conn.connection.db;
  const auth = createAuth(db);

  const app = express();

  // CORS must be first
  app.use(
    cors({
      origin: env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  // Cookie parser before auth handler
  app.use(cookieParser());

  // Better Auth handler - must be before JSON parser
  app.all("/api/auth/*splat", toNodeHandler(auth));

  // Stripe webhook needs raw body
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleWebhook
  );

  // JSON parser for all other routes
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Session middleware (maps Better Auth session to Mongoose user)
  app.use(sessionMiddleware);

  // API routes
  app.use("/api/v1", routes);

  // 404 handler
  app.use(notFound);
  app.use(errorHandler);

  // Seed admin
  await seedAdmin();

  // Verify admin exists
  const adminUser = await User.findOne({ email: "admin@fable.com" });
  if (adminUser) {
    console.log(`Admin user found: ${adminUser.email} (role: ${adminUser.role})`);
  } else {
    console.log("WARNING: Admin user not found after seeding");
  }

  // Log auth configuration
  console.log(`Better Auth URL: ${env.BETTER_AUTH_URL}`);
  console.log(`Google OAuth: ${env.GOOGLE_CLIENT_ID ? "Configured" : "NOT CONFIGURED"}`);
  console.log(`Client URL: ${env.CLIENT_URL}`);

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`Auth endpoints: http://localhost:${env.PORT}/api/auth/*`);
    console.log(`API endpoints: http://localhost:${env.PORT}/api/v1/*`);
  });

  return app;
}

start();

export default start;
