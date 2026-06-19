import Bookmark from "../models/Bookmark.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user.id })
    .populate({
      path: "ebook",
      select: "title description coverImage genre price writer soldCount createdAt",
      populate: { path: "writer", select: "name avatar" },
    })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: bookmarks });
});

export const addBookmark = asyncHandler(async (req, res) => {
  const { ebookId } = req.body;
  if (!ebookId) {
    throw new ApiError("ebookId is required", 400);
  }

  const existing = await Bookmark.findOne({
    user: req.user.id,
    ebook: ebookId,
  });
  if (existing) {
    throw new ApiError("Already bookmarked", 409);
  }

  const bookmark = await Bookmark.create({
    user: req.user.id,
    ebook: ebookId,
  });

  res.status(201).json({ success: true, data: bookmark });
});

export const removeBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findOneAndDelete({
    user: req.user.id,
    ebook: req.params.ebookId,
  });

  if (!bookmark) {
    throw new ApiError("Bookmark not found", 404);
  }

  res.json({ success: true, message: "Bookmark removed" });
});
