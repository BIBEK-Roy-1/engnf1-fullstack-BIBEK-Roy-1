import express from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

import {
  createBookingController,
  approveBookingController,
  rejectBookingController,
  cancelBookingController,
  getBookingByIdController,
  getMyBookingsController,
  getAllBookingsController
} from "../controllers/booking.controller.js";

const router = express.Router();

// Create a booking (ADMIN and USER).
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "USER"),
  createBookingController,
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getAllBookingsController,
);

router.get(
  "/mine",
  authenticate,
  authorize("ADMIN", "USER"),
  getMyBookingsController,
);

// Approve a booking (ADMIN only).
router.patch(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  approveBookingController,
);

// Reject a booking (ADMIN only).
router.patch(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  rejectBookingController,
);

router.patch(
  "/:id/cancel",
  authenticate,
  authorize("ADMIN", "USER"),
  cancelBookingController,
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "USER"),
  getBookingByIdController,
);

export default router;
