import { Router } from "express";
import * as stripeController from "../controllers/stripeController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.post("/create-checkout", requireAuth, stripeController.createCheckoutSession);
router.get("/check/:ebookId", requireAuth, stripeController.checkPurchase);

export default router;
