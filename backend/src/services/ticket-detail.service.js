import mongoose from "mongoose";
import Ticket from "../models/ticket.model.js";
import TicketEvent from "../models/ticket-event.model.js";

const createError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const getTicketDetailService = async (ticketId) => {

  if (!mongoose.isValidObjectId(ticketId)) {
    throw createError("Ticket not found", 404, "NOT_FOUND");
  }

  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw createError("Ticket not found", 404, "NOT_FOUND");
  }

  const events = await TicketEvent.find({ ticketId }).sort({ createdAt: 1 });

  return {
    ticket,
    events,
  };
};
