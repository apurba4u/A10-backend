import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { updateProfileSchema } from "../validators/user.js";

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate("purchasedEbooks", "title coverImage price genre")
    .populate("bookmarks", "title coverImage price genre")
    .populate("wishlist", "title coverImage price genre");

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      isVerifiedWriter: user.isVerifiedWriter,
      purchasedEbooks: user.purchasedEbooks,
      bookmarks: user.bookmarks,
      wishlist: user.wishlist,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const result = updateProfileSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ");
    throw new ApiError(messages, 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: result.data },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      isVerifiedWriter: user.isVerifiedWriter,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});
