import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getTicketStatsController } from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/", authenticate, getTicketStatsController);

export default router;