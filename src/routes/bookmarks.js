import { Router } from "express";
import * as bookmarkController from "../controllers/bookmarkController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, bookmarkController.listBookmarks);
router.post("/", requireAuth, bookmarkController.addBookmark);
router.delete("/:ebookId", requireAuth, bookmarkController.removeBookmark);

export default router;
