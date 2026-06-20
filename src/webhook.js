import Stripe from "stripe";
import Transaction from "./models/Transaction.js";
import Ebook from "./models/Ebook.js";
import User from "./models/User.js";
import Coupon from "./models/Coupon.js";
import Notification from "./models/Notification.js";
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
    const { ebookId, userId, type, couponCode } = session.metadata;

    try {
      if (type === "writer_verification") {
        await Transaction.findOneAndUpdate(
          { transactionId: session.id },
          { status: "completed" }
        );

        await Notification.create({
          user: userId,
          title: "Writer Application Submitted",
          message: "Your payment has been received. Your writer application is now pending admin review. You will be notified once a decision is made.",
          type: "info",
        });

        console.log(`Writer verification payment completed: ${userId}`);
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

        const ebook = await Ebook.findByIdAndUpdate(ebookId, { $inc: { soldCount: 1 } }).select("title");

        if (couponCode) {
          await Coupon.findOneAndUpdate(
            { code: couponCode },
            { $inc: { usedCount: 1 } }
          );
          await User.findByIdAndUpdate(userId, {
            $addToSet: { usedCoupons: couponCode },
          });
        }

        await Notification.create({
          user: userId,
          title: "Purchase Successful",
          message: `Your ebook "${ebook?.title || "ebook"}" has been added to My Library. You can now read it from your dashboard.`,
          type: "success",
        });

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
