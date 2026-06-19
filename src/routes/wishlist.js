import { Router } from "express";
import * as wishlistController from "../controllers/wishlistController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, wishlistController.listWishlist);
router.post("/", requireAuth, wishlistController.addWishlist);
router.delete("/:ebookId", requireAuth, wishlistController.removeWishlist);

export default router;
