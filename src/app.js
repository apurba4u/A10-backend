import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
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

let cachedApp = null;

export async function initApp() {
  if (cachedApp) return cachedApp;

  const conn = await connectDB();
  const db = conn.db;
  const auth = createAuth(db);

  const app = express();

  // CORS must be first
  const allowedOrigins = [
    env.CLIENT_URL,
    env.FRONTEND_URL,
    "http://localhost:3000",
    "https://fable-tau.vercel.app",
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
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

  // Root route
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Fable Backend API Running",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // Health check route
  app.get("/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
    res.json({
      success: true,
      status: "healthy",
      database: states[dbState] || "unknown",
      databaseName: mongoose.connection.name || "unknown",
      environment: env.NODE_ENV,
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use("/api/v1", routes);

  // 404 handler
  app.use(notFound);
  app.use(errorHandler);

  // Seed admin (idempotent)
  await seedAdmin();

  console.log(`[${env.NODE_ENV}] MongoDB: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
  console.log(`[${env.NODE_ENV}] Better Auth URL: ${env.BETTER_AUTH_URL}`);
  console.log(`[${env.NODE_ENV}] Google OAuth: ${env.GOOGLE_CLIENT_ID ? "Configured" : "NOT CONFIGURED"}`);
  console.log(`[${env.NODE_ENV}] Client URL: ${env.CLIENT_URL}`);

  cachedApp = app;
  return app;
}

async function start() {
  const app = await initApp();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`Root:       http://localhost:${env.PORT}/`);
    console.log(`Health:     http://localhost:${env.PORT}/health`);
    console.log(`Auth:       http://localhost:${env.PORT}/api/auth/*`);
    console.log(`API:        http://localhost:${env.PORT}/api/v1/*`);
  });
}

const isVercel = !!process.env.VERCEL;
if (!isVercel) {
  start();
}

export default initApp;
