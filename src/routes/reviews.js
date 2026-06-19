import { Router } from "express";
import {
  getReviewsForEbook,
  createReview,
  updateReview,
  deleteReview,
  getEbookRatingStats,
} from "../controllers/reviewController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get("/ebook/:ebookId", getReviewsForEbook);
router.get("/ebook/:ebookId/stats", getEbookRatingStats);
router.post("/ebook/:ebookId", requireAuth, createReview);
router.put("/:reviewId", requireAuth, updateReview);
router.delete("/:reviewId", requireAuth, deleteReview);

export default router;
