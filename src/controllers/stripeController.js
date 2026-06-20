import Stripe from "stripe";
import Ebook from "../models/Ebook.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import WriterApplication from "../models/WriterApplication.js";
import Coupon from "../models/Coupon.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import env from "../config/env.js";

let stripe = null;
if (env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(env.STRIPE_SECRET_KEY);
}

export const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError("Stripe is not configured", 500);
  }

  const { ebookId, type, couponCode } = req.body;

  if (type === "verification") {
    const VERIFICATION_FEE_CENTS = 1000;

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
      success_url: `${env.CLIENT_URL}/dashboard/application-status?payment=success`,
      cancel_url: `${env.CLIENT_URL}/become-writer?payment=cancelled`,
    });

    await Transaction.create({
      user: req.user.id,
      type: "verification",
      amount: VERIFICATION_FEE_CENTS / 100,
      transactionId: session.id,
    });

    await WriterApplication.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      paymentAmount: VERIFICATION_FEE_CENTS / 100,
      transactionId: session.id,
    });

    return res.json({ success: true, url: session.url });
  }

  if (!ebookId) {
    throw new ApiError("ebookId is required", 400);
  }

  const ebook = await Ebook.findById(ebookId);
  if (!ebook) {
    throw new ApiError("Ebook not found", 404);
  }

  if (ebook.price === 0) {
    throw new ApiError("Free ebooks do not require purchase", 400);
  }

  if (ebook.writer.toString() === req.user.id) {
    throw new ApiError("Cannot purchase your own ebook", 400);
  }

  const existingPurchase = await Transaction.findOne({
    user: req.user.id,
    ebook: ebookId,
    type: "purchase",
    $or: [{ status: "completed" }, { status: { $exists: false } }],
  });
  if (existingPurchase) {
    throw new ApiError("Already purchased", 409);
  }

  const originalPrice = ebook.price;
  let discountAmount = 0;
  let finalPrice = originalPrice;
  let appliedCouponCode = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) {
      throw new ApiError("Invalid coupon code", 404);
    }
    if (!coupon.isActive) {
      throw new ApiError("This coupon is no longer active", 400);
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new ApiError("This coupon has expired", 400);
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError("This coupon has reached its usage limit", 400);
    }
    if (originalPrice < coupon.minPurchaseAmount) {
      throw new ApiError(
        `Minimum purchase amount is $${coupon.minPurchaseAmount}`,
        400
      );
    }

    const user = await User.findById(req.user.id).select("usedCoupons");
    if (user && user.usedCoupons.includes(coupon.code)) {
      throw new ApiError(
        `You have already redeemed ${coupon.code}. This coupon can only be used once per account.`,
        400
      );
    }

    discountAmount = Math.round(originalPrice * coupon.discountPercent) / 100;
    finalPrice = Math.round((originalPrice - discountAmount) * 100) / 100;
    appliedCouponCode = coupon.code;
  }

  const chargeAmount = Math.round(finalPrice * 100);

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
          unit_amount: chargeAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      ebookId: ebook._id.toString(),
      userId: req.user.id,
      type: "ebook_purchase",
      couponCode: appliedCouponCode,
    },
    success_url: `${env.CLIENT_URL}/ebook/${ebook._id}?purchase=success`,
    cancel_url: `${env.CLIENT_URL}/ebook/${ebook._id}?purchase=cancelled`,
  });

  await Transaction.create({
    user: req.user.id,
    ebook: ebook._id,
    type: "purchase",
    amount: finalPrice,
    originalPrice,
    discountAmount,
    finalPrice,
    couponCode: appliedCouponCode,
    transactionId: session.id,
    status: "pending",
  });

  res.json({ success: true, url: session.url });
});

export const checkPurchase = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    user: req.user.id,
    ebook: req.params.ebookId,
    type: "purchase",
    $or: [{ status: "completed" }, { status: { $exists: false } }],
  });

  res.json({ success: true, purchased: !!transaction });
});
