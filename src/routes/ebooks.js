import { Router } from "express";
import * as ebookController from "../controllers/ebookController.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = Router();

router.get("/", ebookController.listEbooks);
router.get("/featured", ebookController.getFeaturedEbooks);
router.get("/top-writers", ebookController.getTopWriters);
router.get("/genre/:genre", ebookController.getEbooksByGenre);
router.get("/:id", ebookController.getEbookById);

router.post("/", requireAuth, requireRole("writer", "admin"), ebookController.createEbook);
router.put("/:id", requireAuth, requireRole("writer", "admin"), ebookController.updateEbook);
router.delete("/:id", requireAuth, requireRole("writer", "admin"), ebookController.deleteEbook);
router.patch("/:id/publish", requireAuth, requireRole("writer", "admin"), ebookController.togglePublish);

export default router;
