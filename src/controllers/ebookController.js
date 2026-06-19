import Ebook from "../models/Ebook.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createEbookSchema, updateEbookSchema } from "../validators/ebook.js";

export const listEbooks = asyncHandler(async (req, res) => {
  const {
    search,
    genre,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 12,
  } = req.query;

  const query = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (genre) {
    query.genre = genre;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  query.isPublished = true;

  let sortOption = {};
  switch (sort) {
    case "oldest":
      sortOption = { createdAt: 1 };
      break;
    case "price_asc":
      sortOption = { price: 1 };
      break;
    case "price_desc":
      sortOption = { price: -1 };
      break;
    case "popular":
      sortOption = { soldCount: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [ebooks, total] = await Promise.all([
    Ebook.find(query)
      .populate("writer", "name avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    Ebook.countDocuments(query),
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

export const listAllEbooks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [ebooks, total] = await Promise.all([
    Ebook.find()
      .populate("writer", "name email avatar")
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

export const getEbookById = asyncHandler(async (req, res) => {
  const ebook = await Ebook.findById(req.params.id).populate(
    "writer",
    "name avatar email"
  );

  if (!ebook) {
    throw new ApiError("Ebook not found", 404);
  }

  res.json({ success: true, data: ebook });
});

export const createEbook = asyncHandler(async (req, res) => {
  const result = createEbookSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ");
    throw new ApiError(messages, 400);
  }

  const ebook = await Ebook.create({
    ...result.data,
    writer: req.user.id,
  });

  res.status(201).json({ success: true, data: ebook });
});

export const updateEbook = asyncHandler(async (req, res) => {
  const result = updateEbookSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ");
    throw new ApiError(messages, 400);
  }

  const ebook = await Ebook.findById(req.params.id);
  if (!ebook) {
    throw new ApiError("Ebook not found", 404);
  }

  if (ebook.writer.toString() !== req.user.id && req.user.role !== "admin") {
    throw new ApiError("Not authorized to update this ebook", 403);
  }

  Object.assign(ebook, result.data);
  await ebook.save();

  res.json({ success: true, data: ebook });
});

export const deleteEbook = asyncHandler(async (req, res) => {
  const ebook = await Ebook.findById(req.params.id);
  if (!ebook) {
    throw new ApiError("Ebook not found", 404);
  }

  if (ebook.writer.toString() !== req.user.id && req.user.role !== "admin") {
    throw new ApiError("Not authorized to delete this ebook", 403);
  }

  await ebook.deleteOne();

  res.json({ success: true, message: "Ebook deleted" });
});

export const togglePublish = asyncHandler(async (req, res) => {
  const ebook = await Ebook.findById(req.params.id);
  if (!ebook) {
    throw new ApiError("Ebook not found", 404);
  }

  if (ebook.writer.toString() !== req.user.id && req.user.role !== "admin") {
    throw new ApiError("Not authorized to modify this ebook", 403);
  }

  ebook.isPublished = !ebook.isPublished;
  await ebook.save();

  res.json({ success: true, data: ebook });
});

export const getFeaturedEbooks = asyncHandler(async (req, res) => {
  const ebooks = await Ebook.find({ isPublished: true })
    .populate("writer", "name avatar")
    .sort({ createdAt: -1 })
    .limit(6);

  res.json({ success: true, data: ebooks });
});

export const getTopWriters = asyncHandler(async (req, res) => {
  const writers = await User.find({ role: "writer" })
    .select("name avatar")
    .limit(3);

  const writersWithStats = await Promise.all(
    writers.map(async (writer) => {
      const totalSold = await Ebook.aggregate([
        { $match: { writer: writer._id } },
        { $group: { _id: null, total: { $sum: "$soldCount" } } },
      ]);
      return {
        ...writer.toObject(),
        totalSold: totalSold[0]?.total || 0,
      };
    })
  );

  res.json({ success: true, data: writersWithStats });
});

export const getEbooksByGenre = asyncHandler(async (req, res) => {
  const { genre } = req.params;
  const ebooks = await Ebook.find({ genre, isPublished: true })
    .populate("writer", "name avatar")
    .sort({ createdAt: -1 })
    .limit(12);

  res.json({ success: true, data: ebooks });
});
