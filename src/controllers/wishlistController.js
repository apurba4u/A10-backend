import Wishlist from "../models/Wishlist.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.find({ user: req.user.id })
    .populate({
      path: "ebook",
      select: "title description coverImage genre price writer soldCount createdAt",
      populate: { path: "writer", select: "name avatar" },
    })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: wishlist });
});

export const addWishlist = asyncHandler(async (req, res) => {
  const { ebookId } = req.body;
  if (!ebookId) {
    throw new ApiError("ebookId is required", 400);
  }

  const existing = await Wishlist.findOne({
    user: req.user.id,
    ebook: ebookId,
  });
  if (existing) {
    throw new ApiError("Already in wishlist", 409);
  }

  const wishlistItem = await Wishlist.create({
    user: req.user.id,
    ebook: ebookId,
  });

  res.status(201).json({ success: true, data: wishlistItem });
});

export const removeWishlist = asyncHandler(async (req, res) => {
  const wishlistItem = await Wishlist.findOneAndDelete({
    user: req.user.id,
    ebook: req.params.ebookId,
  });

  if (!wishlistItem) {
    throw new ApiError("Wishlist item not found", 404);
  }

  res.json({ success: true, message: "Removed from wishlist" });
});
