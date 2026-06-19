import mongoose from "mongoose";
import Review from "../models/Review.js";
import Transaction from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getReviewsForEbook = asyncHandler(async (req, res) => {
  const { ebookId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find({ ebook: ebookId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments({ ebook: ebookId }),
  ]);

  const stats = await Review.aggregate([
    { $match: { ebook: mongoose.Types.ObjectId.createFromHexString(ebookId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      averageRating: stats[0]?.averageRating || 0,
      reviewCount: stats[0]?.reviewCount || 0,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

export const createReview = asyncHandler(async (req, res) => {
  const { ebookId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError("Rating must be between 1 and 5", 400);
  }

  const existingPurchase = await Transaction.findOne({
    user: req.user.id,
    ebook: ebookId,
    type: "purchase",
    status: "completed",
  });

  if (!existingPurchase) {
    throw new ApiError("You must purchase this ebook before reviewing", 403);
  }

  const existingReview = await Review.findOne({ user: req.user.id, ebook: ebookId });
  if (existingReview) {
    throw new ApiError("You have already reviewed this ebook", 409);
  }

  const review = await Review.create({
    user: req.user.id,
    ebook: ebookId,
    rating: Math.round(rating),
    comment: comment || "",
  });

  await review.populate("user", "name avatar");

  res.status(201).json({ success: true, data: review });
});

export const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  if (review.user.toString() !== req.user.id) {
    throw new ApiError("You can only edit your own review", 403);
  }

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      throw new ApiError("Rating must be between 1 and 5", 400);
    }
    review.rating = Math.round(rating);
  }
  if (comment !== undefined) {
    review.comment = comment;
  }

  await review.save();
  await review.populate("user", "name avatar");

  res.json({ success: true, data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    throw new ApiError("Not authorized to delete this review", 403);
  }

  await review.deleteOne();
  res.json({ success: true, message: "Review deleted" });
});

export const getEbookRatingStats = asyncHandler(async (req, res) => {
  const { ebookId } = req.params;

  const stats = await Review.aggregate([
    {
      $match: { ebook: mongoose.Types.ObjectId.createFromHexString(ebookId) },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
  ]);

  let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (stats[0]?.ratingDistribution) {
    stats[0].ratingDistribution.forEach((r) => {
      distribution[r] = (distribution[r] || 0) + 1;
    });
  }

  res.json({
    success: true,
    data: {
      averageRating: stats[0]?.averageRating || 0,
      reviewCount: stats[0]?.reviewCount || 0,
      distribution,
    },
  });
});
