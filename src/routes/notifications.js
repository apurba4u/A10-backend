import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markOneAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, getNotifications);
router.put("/read", requireAuth, markAsRead);
router.put("/:id/read", requireAuth, markOneAsRead);
router.delete("/:id", requireAuth, deleteNotification);

export default router;
