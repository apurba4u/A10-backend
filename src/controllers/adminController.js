import User from "../models/User.js";
import Ebook from "../models/Ebook.js";
import Transaction from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find()
      .select("-bookmarks -wishlist -purchasedEbooks")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role || !["user", "writer", "admin"].includes(role)) {
    throw new ApiError("Invalid role", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
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
      role: user.role,
    },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user.role === "admin") {
    throw new ApiError("Cannot delete admin users", 403);
  }

  await user.deleteOne();
  res.json({ success: true, message: "User deleted" });
});

export const listAllEbooksAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [ebooks, total] = await Promise.all([
    Ebook.find()
      .populate("writer", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Ebook.countDocuments(),
  ]);

  res.json({
    success: true,
    data: ebooks,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

export const deleteEbookAdmin = asyncHandler(async (req, res) => {
  const ebook = await Ebook.findById(req.params.id);
  if (!ebook) {
    throw new ApiError("Ebook not found", 404);
  }

  await ebook.deleteOne();
  res.json({ success: true, message: "Ebook deleted" });
});

export const togglePublishAdmin = asyncHandler(async (req, res) => {
  const ebook = await Ebook.findById(req.params.id);
  if (!ebook) {
    throw new ApiError("Ebook not found", 404);
  }

  ebook.isPublished = !ebook.isPublished;
  await ebook.save();

  res.json({ success: true, data: ebook });
});

export const listAllTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    Transaction.find()
      .populate("user", "name email avatar")
      .populate("ebook", "title price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Transaction.countDocuments(),
  ]);

  res.json({
    success: true,
    data: transactions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const [totalUsers, totalWriters, totalEbooks, revenueResult, genreStats] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: ["writer", "admin"] } }),
      Ebook.countDocuments(),
      Transaction.aggregate([
        { $match: { type: "purchase", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Ebook.aggregate([
        { $group: { _id: "$genre", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalWriters,
      totalEbooks,
      totalRevenue: revenueResult[0]?.total || 0,
      genreDistribution: genreStats,
    },
  });
});

export const getMonthlyRevenue = asyncHandler(async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyRevenue = await Transaction.aggregate([
    {
      $match: {
        type: "purchase",
        status: "completed",
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const result = monthlyRevenue.map((item) => ({
    month: months[item._id.month - 1],
    year: item._id.year,
    revenue: item.revenue,
    sales: item.count,
  }));

  res.json({ success: true, data: result });
});
