import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      index: true,
    },
    ebook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ebook",
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.index({ user: 1, ebook: 1 }, { unique: true, partialFilterExpression: { ebook: { $type: "objectId" } } });

export default mongoose.model("Purchase", purchaseSchema);
