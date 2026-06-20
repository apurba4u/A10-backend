import { Router } from "express";
import * as authController from "../controllers/authController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/session", authController.getSession);
router.post("/logout", authController.logout);
router.put("/role", requireAuth, authController.updateRole);

export default router;
