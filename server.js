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
import { stripe } from "./routes/payments.js";
import Purchase from "./models/Purchase.js";
import Ebook from "./models/Ebook.js";
import seedAdmin from "./seeds/admin.js";

async function start() {
  const conn = await connectDB();
  const db = conn.connection.db;
  const auth = createAuth(db);

  const app = express();

  app.use(cors({
    origin: env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }));

  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe) return res.status(500).json({ message: "Stripe not configured" });

    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return res.status(400).json({ message: "Invalid signature" });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { ebookId, userId, type } = session.metadata;

      if (type === "writer_verification") {
        const mongoose = await import("mongoose");
        const usersCollection = mongoose.default.connection.db.collection("user");
        await usersCollection.findOneAndUpdate(
          { email: session.customer_details?.email },
          { $set: { isVerified: true, role: "writer" } }
        );
      } else if (type === "ebook_purchase" && ebookId && userId) {
        await Purchase.findOneAndUpdate(
          { stripeSessionId: session.id },
          { status: "completed", purchaseDate: new Date() }
        );
        await Ebook.findByIdAndUpdate(ebookId, { $inc: { purchaseCount: 1 } });
      }
    }

    if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      await Purchase.findOneAndUpdate(
        { stripeSessionId: event.data.object.id },
        { status: "failed" }
      );
    }

    res.json({ received: true });
  });

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

const server = start();

export default server;
