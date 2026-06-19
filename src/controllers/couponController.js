import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createCouponSchema, validateCouponSchema } from "../validators/coupon.js";

export const validateCoupon = asyncHandler(async (req, res) => {
  const parsed = validateCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0].message, 400);
  }

  const { code, purchaseAmount } = parsed.data;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
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

  if (purchaseAmount < coupon.minPurchaseAmount) {
    throw new ApiError(
      `Minimum purchase amount is $${coupon.minPurchaseAmount}`,
      400
    );
  }

  if (req.user) {
    const user = await User.findById(req.user.id).select("usedCoupons");
    if (user && user.usedCoupons.includes(coupon.code)) {
      throw new ApiError(
        `You have already redeemed ${coupon.code}. This coupon can only be used once per account.`,
        400
      );
    }
  }

  const discountAmount = purchaseAmount * coupon.discountPercent / 100;
  const finalPrice = purchaseAmount - discountAmount;

  res.json({
    success: true,
    data: {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
    },
  });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const parsed = createCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0].message, 400);
  }

  const existing = await Coupon.findOne({ code: parsed.data.code.toUpperCase() });
  if (existing) {
    throw new ApiError("Coupon code already exists", 409);
  }

  const coupon = await Coupon.create(parsed.data);

  res.status(201).json({ success: true, data: coupon });
});

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data: coupons });
});

export const listPublicCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true }).sort({ discountPercent: -1 });
  res.json({ success: true, data: coupons });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    throw new ApiError("Coupon not found", 404);
  }
  res.json({ success: true, message: "Coupon deleted" });
});
