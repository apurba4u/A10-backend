import mongoose from "mongoose";
import dotenv from "dotenv";
import Coupon from "../models/Coupon.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_DB_URI;

const coupons = [
  {
    code: "OVI10",
    description: "10% off your first ebook purchase. Cannot be used for Writer Verification. One use per account.",
    discountPercent: 10,
    isActive: true,
    expiresAt: new Date("2027-12-31"),
    usageLimit: 1000,
    usedCount: 0,
    minPurchaseAmount: 0,
  },
  {
    code: "WELCOME5",
    description: "5% off for new accounts. Welcome to Fable!",
    discountPercent: 5,
    isActive: true,
    expiresAt: new Date("2027-12-31"),
    usageLimit: 2000,
    usedCount: 0,
    minPurchaseAmount: 0,
  },
  {
    code: "READER15",
    description: "15% off selected ebooks. For our dedicated readers.",
    discountPercent: 15,
    isActive: true,
    expiresAt: new Date("2027-06-30"),
    usageLimit: 500,
    usedCount: 0,
    minPurchaseAmount: 5,
  },
  {
    code: "WELCOME20",
    description: "20% off purchases over $5. Limited time offer.",
    discountPercent: 20,
    isActive: true,
    expiresAt: new Date("2026-12-31"),
    usageLimit: 500,
    usedCount: 0,
    minPurchaseAmount: 5,
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
        await Coupon.findOneAndUpdate(
          { code: couponData.code },
          { $set: { description: couponData.description } }
        );
        console.log(`Updated coupon: ${couponData.code}`);
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
