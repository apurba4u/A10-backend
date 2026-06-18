import mongoose from "mongoose";

const ebookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    cover: {
      type: String,
      default: null,
    },
    file: {
      type: String,
      default: null,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      index: true,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: "Uncategorized",
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

ebookSchema.index({ title: "text", description: "text" });
ebookSchema.index({ createdAt: -1 });
ebookSchema.index({ price: 1 });

export default mongoose.model("Ebook", ebookSchema);
