import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { getAdminStatsController } from "../controllers/admin-stats.controller.js";

const router = express.Router();

router.get("/", authenticate, authorize("ADMIN"), getAdminStatsController);

export default router;
