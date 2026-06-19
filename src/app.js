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

async function start() {
  const conn = await connectDB();
  const db = conn.connection.db;
  const auth = createAuth(db);

  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleWebhook
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(sessionMiddleware);

  app.use("/api/v1", routes);

  app.use(notFound);
  app.use(errorHandler);

  await seedAdmin();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });

  return app;
}

start();

export default start;
