import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    ebook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ebook",
      required: [true, "Ebook is required"],
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index({ user: 1, ebook: 1 }, { unique: true });

export default mongoose.model("Wishlist", wishlistSchema);
