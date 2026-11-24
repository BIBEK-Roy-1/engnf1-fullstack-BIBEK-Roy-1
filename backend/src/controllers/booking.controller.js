import {
  createBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  getBookingById,
  getMyBookings,
  getAllBookings,
} from "../services/booking.service.js";

export const createBookingController = async (req, res, next) => {
  try {
    const booking = await createBooking({
      ...req.body,
      userId: req.user.userId,
    });

    return res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
};

export const approveBookingController = async (req, res, next) => {
  try {
    const booking = await approveBooking(req.params.id);
    return res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};

export const rejectBookingController = async (req, res, next) => {
  try {
    const booking = await rejectBooking(req.params.id, req.body.note);

    return res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};

export const cancelBookingController = async (req, res, next) => {
  try {
    const booking = await cancelBooking(req.params.id, req.user.userId);

    return res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};

export const getBookingByIdController = async (req, res, next) => {
  try {
    const booking = await getBookingById(
      req.params.id,
      req.user.userId,
      req.user.role,
    );

    return res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};

export const getMyBookingsController = async (req, res, next) => {
  try {
    const result = await getMyBookings(req.user.userId, req.query);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllBookingsController = async (req, res, next) => {
  try {
    const result = await getAllBookings(req.query);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
