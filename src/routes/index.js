import { Router } from "express";
import mongoose from "mongoose";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import ebookRoutes from "./ebooks.js";
import bookmarkRoutes from "./bookmarks.js";
import wishlistRoutes from "./wishlist.js";
import transactionRoutes from "./transactions.js";
import stripeRoutes from "./stripe.js";
import adminRoutes from "./admin.js";
import couponRoutes from "./coupons.js";
import reviewRoutes from "./reviews.js";
import writerApplicationRoutes from "./writerApplications.js";
import notificationRoutes from "./notifications.js";

const router = Router();

router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({
    success: true,
    status: "healthy",
    database: states[dbState] || "unknown",
    databaseName: mongoose.connection.name || "unknown",
    uptime: process.uptime(),
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/ebooks", ebookRoutes);
router.use("/bookmarks", bookmarkRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/transactions", transactionRoutes);
router.use("/stripe", stripeRoutes);
router.use("/admin", adminRoutes);
router.use("/coupons", couponRoutes);
router.use("/reviews", reviewRoutes);
router.use("/writer-applications", writerApplicationRoutes);
router.use("/notifications", notificationRoutes);

export default router;
