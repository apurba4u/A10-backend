import { Router } from "express";
import ebooks from "./ebooks.js";
import payments from "./payments.js";
import bookmarks from "./bookmarks.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "Fable API is running" });
});

router.use("/ebooks", ebooks);
router.use("/payments", payments);
router.use("/bookmarks", bookmarks);

export default router;
