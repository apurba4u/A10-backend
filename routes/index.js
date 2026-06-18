import { Router } from "express";
import ebooks from "./ebooks.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "Fable API is running" });
});

router.use("/ebooks", ebooks);

export default router;
