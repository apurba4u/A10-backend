import { Router } from "express";
import {
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication,
} from "../controllers/writerApplicationController.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = Router();

router.get("/me", requireAuth, getMyApplication);
router.get("/", requireAuth, requireRole("admin"), getAllApplications);
router.post("/:id/approve", requireAuth, requireRole("admin"), approveApplication);
router.post("/:id/reject", requireAuth, requireRole("admin"), rejectApplication);

export default router;
