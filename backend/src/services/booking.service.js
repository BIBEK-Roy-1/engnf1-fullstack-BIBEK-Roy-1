import mongoose from "mongoose";
import Resource from "../models/resource.model.js";
import User from "../models/user.model.js";
import Ticket from "../models/ticket.model.js";
import Booking from "../models/booking.model.js";
import AppError from "../utils/app-error.js";
import { validateBookingTimeRange ,isValidUTCTimestamp} from "../utils/booking-validation.js";


// Check whether an active booking overlaps the requested slot.
export const hasBookingOverlap = async (
  resourceId,
  startTime,
  endTime,
  excludeBookingId = null,
  session = null,
) => {
  const query = {
    resourceId,
    status: { $in: ["PENDING", "APPROVED"] },
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return Boolean(await Booking.exists(query).session(session));
};

// Create a booking with validation and concurrency protection.
export const createBooking = async ({
  resourceId,
  userId,
  ticketId = null,
  startTime,
  endTime,
  purpose,
}) => {
  // Validate booking time and duration.
  const timeError = validateBookingTimeRange(startTime, endTime);

  if (timeError) {
    throw new AppError(timeError, 400, "VALIDATION_ERROR");
  }

  // Validate purpose.
  if (
    typeof purpose !== "string" ||
    purpose.trim().length < 5 ||
    purpose.trim().length > 200
  ) {
    throw new AppError(
      "Purpose must contain between 5 and 200 characters.",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Validate referenced IDs.
  if (!mongoose.isValidObjectId(resourceId)) {
    throw new AppError("Resource not found.", 404, "NOT_FOUND");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("User not found.", 404, "NOT_FOUND");
  }

  if (ticketId && !mongoose.isValidObjectId(ticketId)) {
    throw new AppError("Ticket not found.", 404, "NOT_FOUND");
  }

  const session = await mongoose.startSession();
  let createdBooking;

  try {
    await session.withTransaction(async () => {
      // Lock the active resource.
      const resource = await Resource.findOneAndUpdate(
        { _id: resourceId, isActive: true },
        { $inc: { bookingLockVersion: 1 } },
        { returnDocument: "after", session },
      );

      if (!resource) {
        throw new AppError("Resource not found or inactive.", 404, "NOT_FOUND");
      }

      // Lock the user to protect the booking limit.
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { bookingLockVersion: 1 } },
        { returnDocument: "after", session },
      );

      if (!user) {
        throw new AppError("User not found.", 404, "NOT_FOUND");
      }

      // Validate optional ticket reference.
      if (ticketId) {
        const ticketExists = await Ticket.exists({
          _id: ticketId,
        }).session(session);

        if (!ticketExists) {
          throw new AppError("Ticket not found.", 404, "NOT_FOUND");
        }
      }

      // Check overlapping bookings.
      const overlap = await hasBookingOverlap(
        resourceId,
        startTime,
        endTime,
        null,
        session,
      );

      if (overlap) {
        throw new AppError(
          "This resource is already booked for the requested time.",
          409,
          "CONFLICT",
        );
      }

      //  Maximum three future PENDING/APPROVED bookings per user.
      const now = new Date();

      const activeBookingCount = await Booking.countDocuments({
        userId,
        status: { $in: ["PENDING", "APPROVED"] },
        startTime: { $gt: now },
      }).session(session);

      if (activeBookingCount >= 3) {
        throw new AppError(
          "You already have three future active bookings.",
          409,
          "CONFLICT",
        );
      }

      // New bookings start as PENDING.
      const [booking] = await Booking.create(
        [
          {
            resourceId,
            userId,
            ticketId: ticketId || null,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            purpose: purpose.trim(),
            status: "PENDING",
          },
        ],
        { session },
      );

      createdBooking = booking;
    });
  } finally {
    await session.endSession();
  }

  return createdBooking;
};

//ADMIN approves a future PENDING booking.
export const approveBooking = async (bookingId) => {
  // Path ID validation.
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new AppError("Booking not found.", 404, "NOT_FOUND");
  }

  const existingBooking = await Booking.findById(bookingId);

  if (!existingBooking) {
    throw new AppError("Booking not found.", 404, "NOT_FOUND");
  }

  const now = new Date();

  if (
    existingBooking.status !== "PENDING" ||
    existingBooking.startTime <= now
  ) {
    throw new AppError(
      "Only future PENDING bookings can be approved.",
      409,
      "CONFLICT",
    );
  }

  // Atomic status update.
  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: "PENDING",
      startTime: { $gt: now },
    },
    {
      $set: { status: "APPROVED" },
    },
    { returnDocument: "after" },
  );

  if (!updatedBooking) {
    throw new AppError(
      "Booking status changed. Please try again.",
      409,
      "CONFLICT",
    );
  }

  return updatedBooking;
};

// ADMIN rejects a future PENDING booking with a note.
export const rejectBooking = async (bookingId, note) => {
  // Path ID validation.
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new AppError("Booking not found.", 404, "NOT_FOUND");
  }

  const existingBooking = await Booking.findById(bookingId);

  if (!existingBooking) {
    throw new AppError("Booking not found.", 404, "NOT_FOUND");
  }

  // Validate rejection note after confirming the path ID exists.
  if (
    typeof note !== "string" ||
    note.trim().length < 5 ||
    note.trim().length > 200
  ) {
    throw new AppError(
      "Rejection note must contain between 5 and 200 characters.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const now = new Date();

  if (
    existingBooking.status !== "PENDING" ||
    existingBooking.startTime <= now
  ) {
    throw new AppError(
      "Only future PENDING bookings can be rejected.",
      409,
      "CONFLICT",
    );
  }

  // Atomic status update.
  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: "PENDING",
      startTime: { $gt: now },
    },
    {
      $set: {
        status: "REJECTED",
        decisionNote: note.trim(),
      },
    },
    { returnDocument: "after" },
  );

  if (!updatedBooking) {
    throw new AppError(
      "Booking status changed. Please try again.",
      409,
      "CONFLICT",
    );
  }

  return updatedBooking;
};

// Owner cancels their own future PENDING/APPROVED booking.
export const cancelBooking = async (bookingId, userId) => {
  // Path ID validation.
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new AppError("Booking not found.", 404, "NOT_FOUND");
  }

  const existingBooking = await Booking.findById(bookingId);

  if (!existingBooking) {
    throw new AppError("Booking not found.", 404, "NOT_FOUND");
  }

  // Ownership check before checking booking state.
  if (existingBooking.userId.toString() !== userId.toString()) {
    throw new AppError(
      "You are not allowed to cancel this booking.",
      403,
      "FORBIDDEN",
    );
  }

  const now = new Date();

  if (
    !["PENDING", "APPROVED"].includes(existingBooking.status) ||
    existingBooking.startTime <= now
  ) {
    throw new AppError(
      "Only future PENDING or APPROVED bookings can be cancelled.",
      409,
      "CONFLICT",
    );
  }

  // Atomic status update.
  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      userId,
      status: { $in: ["PENDING", "APPROVED"] },
      startTime: { $gt: now },
    },
    {
      $set: { status: "CANCELLED" },
    },
    { returnDocument: "after" },
  );

  if (!updatedBooking) {
    throw new AppError(
      "Booking status changed. Please try again.",
      409,
      "CONFLICT",
    );
  }

  return updatedBooking;
};


export const getBookingById = async (bookingId, userId, role) => {

  if (!mongoose.isValidObjectId(bookingId)) {
    throw new AppError("Booking not found.", 404, "NOT_FOUND");
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError("Booking not found.", 404, "NOT_FOUND");
  }

  // Ownership check.
  if (role !== "ADMIN" && booking.userId.toString() !== userId.toString()) {
    throw new AppError("You cannot access this booking.", 403, "FORBIDDEN");
  }

  return booking;
};

export const getMyBookings = async (
  userId,
  { status, page = 1, pageSize = 10 } = {},
) => {
  const currentPage = Number(page);
  const limit = Number(pageSize);

  // Validate pagination.
  if (
    !Number.isInteger(currentPage) ||
    currentPage < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new AppError(
      "Invalid pagination parameters.",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Validate optional status filter.
  const allowedStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

  if (status && !allowedStatuses.includes(status)) {
    throw new AppError("Invalid booking status.", 400, "VALIDATION_ERROR");
  }

  const filter = { userId };

  if (status) {
    filter.status = status;
  }

  const [data, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit),

    Booking.countDocuments(filter),
  ]);

  return {
    data,
    page: currentPage,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};


//  Get all bookings with filters and pagination(admin)
export const getAllBookings = async ({
  status,
  resourceId,
  from,
  to,
  page = 1,
  pageSize = 10,
} = {}) => {
  const currentPage = Number(page);
  const limit = Number(pageSize);

  // Validate pagination.
  if (
    !Number.isInteger(currentPage) ||
    currentPage < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new AppError(
      "Invalid pagination parameters.",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Validate status.
  const allowedStatuses = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
  ];

  if (status && !allowedStatuses.includes(status)) {
    throw new AppError(
      "Invalid booking status.",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Validate resource ID.
  if (resourceId && !mongoose.isValidObjectId(resourceId)) {
    throw new AppError(
      "Invalid resource ID.",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Validate date filters.
  if (
    (from && !isValidUTCTimestamp(from)) ||
    (to && !isValidUTCTimestamp(to))
  ) {
    throw new AppError(
      "Invalid date format. Use ISO 8601 UTC timestamps.",
      400,
      "VALIDATION_ERROR",
    );
  }

  if (from && to && new Date(from) >= new Date(to)) {
    throw new AppError(
      "'from' must be earlier than 'to'.",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Build database filter.
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (resourceId) {
    filter.resourceId = resourceId;
  }

 
  if (from || to) {
    filter.startTime = {};
    filter.endTime = {};

    if (to) {
      filter.startTime.$lt = new Date(to);
    }

    if (from) {
      filter.endTime.$gt = new Date(from);
    }
  }

  // Fetch bookings and total count.
  const [data, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit),

    Booking.countDocuments(filter),
  ]);

  return {
    data,
    page: currentPage,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

