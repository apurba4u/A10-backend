import { Router } from "express";
import ebooks from "./ebooks.js";
import payments from "./payments.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "Fable API is running" });
});

router.use("/ebooks", ebooks);
router.use("/payments", payments);

export default router;
