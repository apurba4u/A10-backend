import { Router } from "express";
import * as transactionController from "../controllers/transactionController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get("/user", requireAuth, transactionController.getUserTransactions);
router.get("/writer", requireAuth, transactionController.getWriterSales);

export default router;
