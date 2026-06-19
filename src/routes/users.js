import { Router } from "express";
import * as userController from "../controllers/userController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get("/me", requireAuth, userController.getMe);
router.put("/me", requireAuth, userController.updateMe);

export default router;
