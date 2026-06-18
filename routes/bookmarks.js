import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import Bookmark from "../models/Bookmark.js";

const router = Router();

function requireAuth(req, res, next) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  next();
}

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bookmarks = await Bookmark.find({ user: req.user.id })
      .populate("ebook", "title cover price category description")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookmarks });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { ebookId } = req.body;
    if (!ebookId) throw new AppError("ebookId is required", 400);

    const existing = await Bookmark.findOne({
      user: req.user.id,
      ebook: ebookId,
    });
    if (existing) throw new AppError("Already bookmarked", 409);

    const bookmark = await Bookmark.create({
      user: req.user.id,
      ebook: ebookId,
    });
    res.status(201).json({ success: true, data: bookmark });
  })
);

router.delete(
  "/:ebookId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bookmark = await Bookmark.findOneAndDelete({
      user: req.user.id,
      ebook: req.params.ebookId,
    });
    if (!bookmark) throw new AppError("Bookmark not found", 404);
    res.json({ success: true, message: "Bookmark removed" });
  })
);

export default router;
