import Stripe from "stripe";
import Transaction from "./models/Transaction.js";
import Ebook from "./models/Ebook.js";
import User from "./models/User.js";
import env from "./config/env.js";

let stripe = null;
if (env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(env.STRIPE_SECRET_KEY);
}

export async function handleWebhook(req, res) {
  if (!stripe) {
    return res.status(500).json({ message: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: "Invalid signature" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { ebookId, userId, type } = session.metadata;

    try {
      if (type === "writer_verification") {
        const user = await User.findById(userId);
        if (user) {
          user.isVerifiedWriter = true;
          user.role = "writer";
          await user.save();
        }

        await Transaction.findOneAndUpdate(
          { transactionId: session.id },
          { status: "completed" }
        );

        console.log(`Writer verified: ${userId}`);
      } else if (type === "ebook_purchase" && ebookId && userId) {
        await Transaction.findOneAndUpdate(
          { transactionId: session.id },
          { status: "completed" }
        );

        const user = await User.findById(userId);
        if (user && !user.purchasedEbooks.includes(ebookId)) {
          user.purchasedEbooks.push(ebookId);
          await user.save();
        }

        await Ebook.findByIdAndUpdate(ebookId, { $inc: { soldCount: 1 } });

        console.log(`Ebook purchased: ${ebookId} by user ${userId}`);
      }
    } catch (error) {
      console.error("Webhook processing error:", error.message);
    }
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    try {
      await Transaction.findOneAndUpdate(
        { transactionId: event.data.object.id },
        { status: "failed" }
      );
    } catch (error) {
      console.error("Webhook failed event error:", error.message);
    }
  }

  res.json({ received: true });
}
