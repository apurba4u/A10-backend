import { Router } from "express";
import Stripe from "stripe";
import asyncHandler from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import Ebook from "../models/Ebook.js";
import Purchase from "../models/Purchase.js";
import env from "../config/env.js";

let stripe = null;
if (env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(env.STRIPE_SECRET_KEY);
}

const router = Router();

function requireAuth(req, res, next) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  next();
}

router.post(
  "/create-checkout",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!stripe) throw new AppError("Stripe not configured", 500);

    const { ebookId } = req.body;
    if (!ebookId) throw new AppError("ebookId is required", 400);

    const ebook = await Ebook.findById(ebookId);
    if (!ebook) throw new AppError("Ebook not found", 404);
    if (ebook.price === 0) throw new AppError("Free ebooks don't require purchase", 400);

    if (ebook.author === req.user.id) {
      throw new AppError("Cannot purchase your own ebook", 400);
    }

    const existingPurchase = await Purchase.findOne({
      user: req.user.id,
      ebook: ebookId,
      status: "completed",
    });
    if (existingPurchase) {
      throw new AppError("Already purchased", 409);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: ebook.title,
              description: ebook.description.substring(0, 200),
            },
            unit_amount: Math.round(ebook.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        ebookId: ebook._id.toString(),
        userId: req.user.id,
        type: "ebook_purchase",
      },
      success_url: `${env.CLIENT_URL}/ebooks/${ebook._id}?purchase=success`,
      cancel_url: `${env.CLIENT_URL}/ebooks/${ebook._id}?purchase=cancelled`,
    });

    await Purchase.create({
      user: req.user.id,
      ebook: ebook._id,
      amount: ebook.price,
      stripeSessionId: session.id,
      status: "pending",
    });

    res.json({ success: true, url: session.url });
  })
);

router.post(
  "/verify-writer",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!stripe) throw new AppError("Stripe not configured", 500);

    const VERIFICATION_FEE_CENTS = 999;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Writer Verification",
              description: "One-time fee to become a verified writer on Fable",
            },
            unit_amount: VERIFICATION_FEE_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: req.user.id,
        type: "writer_verification",
      },
      success_url: `${env.CLIENT_URL}/dashboard/writer?verified=success`,
      cancel_url: `${env.CLIENT_URL}/dashboard/writer?verified=cancelled`,
    });

    await Purchase.create({
      user: req.user.id,
      ebook: null,
      amount: VERIFICATION_FEE_CENTS / 100,
      stripeSessionId: session.id,
      status: "pending",
    });

    res.json({ success: true, url: session.url });
  })
);

router.get(
  "/history",
  requireAuth,
  asyncHandler(async (req, res) => {
    const purchases = await Purchase.find({ user: req.user.id })
      .populate("ebook", "title cover price")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: purchases });
  })
);

router.get(
  "/check/:ebookId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const purchase = await Purchase.findOne({
      user: req.user.id,
      ebook: req.params.ebookId,
      status: "completed",
    });
    res.json({ success: true, purchased: !!purchase });
  })
);

export { stripe };
export default router;
