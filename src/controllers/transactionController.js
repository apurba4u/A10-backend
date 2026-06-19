import Transaction from "../models/Transaction.js";
import Ebook from "../models/Ebook.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getUserTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id })
    .populate("ebook", "title coverImage genre price")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: transactions });
});

export const getWriterSales = asyncHandler(async (req, res) => {
  const writerEbooks = await Ebook.find({ writer: req.user.id }).select("_id");
  const ebookIds = writerEbooks.map((e) => e._id);

  const sales = await Transaction.find({
    ebook: { $in: ebookIds },
    type: "purchase",
    status: "completed",
  })
    .populate("ebook", "title coverImage price")
    .populate("user", "name email avatar")
    .sort({ createdAt: -1 });

  const stats = await Transaction.aggregate([
    {
      $match: {
        ebook: { $in: ebookIds },
        type: "purchase",
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        totalSales: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      sales,
      stats: stats[0] || { totalRevenue: 0, totalSales: 0 },
    },
  });
});
