import { Router } from "express";
import Ebook from "../models/Ebook.js";
import asyncHandler from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { createEbookSchema, updateEbookSchema } from "../validators/ebook.js";

const router = Router();

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(", ");
      throw new AppError(messages, 400);
    }
    req.validated = result.data;
    next();
  };
}

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    if (!roles.includes(req.user.role)) throw new AppError("Not authorized", 403);
    next();
  };
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      search,
      category,
      tags,
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

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(",");
      query.tags = { $in: tagList };
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
        sortOption = { purchaseCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [ebooks, total] = await Promise.all([
      Ebook.find(query).sort(sortOption).skip(skip).limit(limitNum),
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
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) throw new AppError("Ebook not found", 404);
    res.json({ success: true, data: ebook });
  })
);

router.post(
  "/",
  requireRole("writer", "admin"),
  validate(createEbookSchema),
  asyncHandler(async (req, res) => {
    const ebook = await Ebook.create({
      ...req.validated,
      author: req.user.id,
    });
    res.status(201).json({ success: true, data: ebook });
  })
);

router.put(
  "/:id",
  requireRole("writer", "admin"),
  validate(updateEbookSchema),
  asyncHandler(async (req, res) => {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) throw new AppError("Ebook not found", 404);
    if (ebook.author !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Not authorized", 403);
    }
    Object.assign(ebook, req.validated);
    await ebook.save();
    res.json({ success: true, data: ebook });
  })
);

router.delete(
  "/:id",
  requireRole("writer", "admin"),
  asyncHandler(async (req, res) => {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) throw new AppError("Ebook not found", 404);
    if (ebook.author !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Not authorized", 403);
    }
    await ebook.deleteOne();
    res.json({ success: true, message: "Ebook deleted" });
  })
);

router.patch(
  "/:id/publish",
  requireRole("writer", "admin"),
  asyncHandler(async (req, res) => {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) throw new AppError("Ebook not found", 404);
    if (ebook.author !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Not authorized", 403);
    }
    ebook.isPublished = !ebook.isPublished;
    await ebook.save();
    res.json({ success: true, data: ebook });
  })
);

export default router;
