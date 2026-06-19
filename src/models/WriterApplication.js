import mongoose from "mongoose";

const writerApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    userName: {
      type: String,
      default: "",
    },
    userEmail: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    paymentAmount: {
      type: Number,
      required: [true, "Payment amount is required"],
    },
    transactionId: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    refundStatus: {
      type: String,
      enum: ["none", "refunded"],
      default: "none",
    },
  },
  {
    timestamps: true,
  }
);

writerApplicationSchema.index({ user: 1 });
writerApplicationSchema.index({ status: 1 });

export default mongoose.model("WriterApplication", writerApplicationSchema);
