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
    fullContent: {
      type: String,
      default: "",
    },
    genre: {
      type: String,
      required: [true, "Genre is required"],
      enum: [
        "Fiction",
        "Mystery",
        "Romance",
        "Sci-Fi",
        "Fantasy",
        "Horror",
        "Thriller",
        "Biography",
        "Technology",
        "Science",
        "History",
        "Self-Help",
        "Business",
        "Uncategorized",
      ],
      default: "Uncategorized",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    coverImage: {
      type: String,
      default: null,
    },
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Writer is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ebookSchema.index({ title: "text", description: "text" });
ebookSchema.index({ genre: 1 });
ebookSchema.index({ writer: 1 });
ebookSchema.index({ createdAt: -1 });
ebookSchema.index({ price: 1 });

export default mongoose.model("Ebook", ebookSchema);
