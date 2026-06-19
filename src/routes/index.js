import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import ebookRoutes from "./ebooks.js";
import bookmarkRoutes from "./bookmarks.js";
import wishlistRoutes from "./wishlist.js";
import transactionRoutes from "./transactions.js";
import stripeRoutes from "./stripe.js";
import adminRoutes from "./admin.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "Fable API is running" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/ebooks", ebookRoutes);
router.use("/bookmarks", bookmarkRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/transactions", transactionRoutes);
router.use("/stripe", stripeRoutes);
router.use("/admin", adminRoutes);

export default router;
