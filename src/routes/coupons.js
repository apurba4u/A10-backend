import { Router } from "express";
import * as couponController from "../controllers/couponController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get("/public", couponController.listPublicCoupons);
router.post("/validate", requireAuth, couponController.validateCoupon);
router.post("/", requireAuth, couponController.createCoupon);
router.get("/", requireAuth, couponController.listCoupons);
router.delete("/:id", requireAuth, couponController.deleteCoupon);

export default router;
