import mongoose from "mongoose";
import dotenv from "dotenv";
import Coupon from "../models/Coupon.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_DB_URI;

const coupons = [
  {
    code: "OVI10",
    discountPercent: 10,
    isActive: true,
    expiresAt: new Date("2027-12-31"),
    usageLimit: 1000,
    usedCount: 0,
    minPurchaseAmount: 0,
  },
  {
    code: "WELCOME20",
    discountPercent: 20,
    isActive: true,
    expiresAt: new Date("2026-12-31"),
    usageLimit: 500,
    usedCount: 0,
    minPurchaseAmount: 5,
  },
  {
    code: "SAVE5",
    discountPercent: 5,
    isActive: true,
    expiresAt: null,
    usageLimit: null,
    usedCount: 0,
    minPurchaseAmount: 0,
  },
];

async function seedCoupons() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    for (const couponData of coupons) {
      const existing = await Coupon.findOne({ code: couponData.code });
      if (!existing) {
        await Coupon.create(couponData);
        console.log(`Created coupon: ${couponData.code}`);
      } else {
        console.log(`Coupon ${couponData.code} already exists, skipping`);
      }
    }

    console.log("Coupon seed complete!");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedCoupons();
