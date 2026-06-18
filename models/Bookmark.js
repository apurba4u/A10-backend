import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      index: true,
    },
    ebook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ebook",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

bookmarkSchema.index({ user: 1, ebook: 1 }, { unique: true });

export default mongoose.model("Bookmark", bookmarkSchema);
