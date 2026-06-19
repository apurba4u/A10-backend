import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { adminGetAllReviews, adminDeleteReview } from "../controllers/adminReviewController.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/users", adminController.listUsers);
router.put("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

router.get("/ebooks", adminController.listAllEbooksAdmin);
router.delete("/ebooks/:id", adminController.deleteEbookAdmin);
router.patch("/ebooks/:id/publish", adminController.togglePublishAdmin);

router.get("/transactions", adminController.listAllTransactions);

router.get("/analytics/overview", adminController.getAnalytics);
router.get("/analytics/revenue", adminController.getMonthlyRevenue);

router.get("/reviews", adminGetAllReviews);
router.delete("/reviews/:id", adminDeleteReview);

export default router;
