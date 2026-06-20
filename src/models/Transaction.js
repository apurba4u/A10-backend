import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["verification", "purchase"],
      required: [true, "Transaction type is required"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    ebook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ebook",
      default: null,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1 });
transactionSchema.index({ ebook: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });

export default mongoose.model("Transaction", transactionSchema);
