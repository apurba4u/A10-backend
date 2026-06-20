import WriterApplication from "../models/WriterApplication.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getMyApplication = asyncHandler(async (req, res) => {
  const application = await WriterApplication.findOne({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("reviewedBy", "name email");
  res.json({ success: true, data: application });
});

export const getAllApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  const [applications, total] = await Promise.all([
    WriterApplication.find(query)
      .populate("user", "name email avatar")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    WriterApplication.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: applications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

export const approveApplication = asyncHandler(async (req, res) => {
  const application = await WriterApplication.findById(req.params.id);
  if (!application) {
    throw new ApiError("Application not found", 404);
  }
  if (application.status !== "pending") {
    throw new ApiError("Application has already been reviewed", 400);
  }

  application.status = "approved";
  application.reviewedBy = req.user.id;
  application.reviewedAt = new Date();
  await application.save();

  await User.findByIdAndUpdate(application.user, {
    role: "writer",
    isVerifiedWriter: true,
  });

  await Notification.create({
    user: application.user,
    title: "Writer Application Approved",
    message: "Congratulations! Your application has been approved. You are now a verified writer and can start publishing ebooks.",
    type: "success",
  });

  res.json({ success: true, message: "Application approved", data: application });
});

export const rejectApplication = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  if (!rejectionReason || rejectionReason.trim().length < 20) {
    throw new ApiError("Rejection reason must be at least 20 characters", 400);
  }

  const application = await WriterApplication.findById(req.params.id);
  if (!application) {
    throw new ApiError("Application not found", 404);
  }
  if (application.status !== "pending") {
    throw new ApiError("Application has already been reviewed", 400);
  }

  application.status = "rejected";
  application.reviewedBy = req.user.id;
  application.reviewedAt = new Date();
  application.rejectionReason = rejectionReason.trim();
  application.refundStatus = "refunded";
  await application.save();

  await Notification.create({
    user: application.user,
    title: "Writer Application Rejected",
    message: `Your writer application was not approved. Reason: ${rejectionReason.trim()}. Your payment has been refunded.`,
    type: "error",
  });

  res.json({ success: true, message: "Application rejected", data: application });
});
