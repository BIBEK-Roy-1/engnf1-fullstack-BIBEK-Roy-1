import mongoose from "mongoose";
import Ticket from "../models/ticket.model.js";
import TicketEvent from "../models/ticket-event.model.js";
import User from "../models/user.model.js";

const TICKET_CATEGORIES = [
  "BILLING",
  "BUG",
  "FEATURE_REQUEST",
  "LOGIN",
  "DELIVERY",
];

const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const ALLOWED_FIELDS = ["category", "priority", "status", "assigneeId"];

const createError = (statusCode, message, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const updateTicketService = async (ticketId, updates, actor) => {
  // 1. Validate ticket ID
  if (!mongoose.isObjectIdOrHexString(ticketId)) {
    throw createError(404, "Ticket not found", "NOT_FOUND");
  }

  // 2. Start transaction
  const session = await mongoose.startSession();

  try {
    let updatedTicket;
    let ticketEvents;

    await session.withTransaction(async () => {
      // 3. Find ticket
      const ticket = await Ticket.findById(ticketId).session(session);

      if (!ticket) {
        throw createError(404, "Ticket not found", "NOT_FOUND");
      }

      // 4. Validate request body
      if (
        !updates ||
        typeof updates !== "object" ||
        Array.isArray(updates) ||
        Object.keys(updates).length === 0
      ) {
        throw createError(
          400,
          "At least one update field is required",
          "VALIDATION_ERROR",
        );
      }

      const requestedFields = Object.keys(updates);

      const invalidFields = requestedFields.filter(
        (field) => !ALLOWED_FIELDS.includes(field),
      );

      if (invalidFields.length > 0) {
        throw createError(
          400,
          `Invalid update fields: ${invalidFields.join(", ")}`,
          "VALIDATION_ERROR",
        );
      }

      // 5. Validate enum values
      if (
        updates.category !== undefined &&
        !TICKET_CATEGORIES.includes(updates.category)
      ) {
        throw createError(400, "Invalid ticket category", "VALIDATION_ERROR");
      }

      if (
        updates.priority !== undefined &&
        !TICKET_PRIORITIES.includes(updates.priority)
      ) {
        throw createError(400, "Invalid ticket priority", "VALIDATION_ERROR");
      }

      if (
        updates.status !== undefined &&
        !TICKET_STATUSES.includes(updates.status)
      ) {
        throw createError(400, "Invalid ticket status", "VALIDATION_ERROR");
      }

      // 6. Validate assignee ID
      if (updates.assigneeId !== undefined && updates.assigneeId !== null) {
        if (
          typeof updates.assigneeId !== "string" ||
          !mongoose.isObjectIdOrHexString(updates.assigneeId)
        ) {
          throw createError(400, "Invalid assignee ID", "VALIDATION_ERROR");
        }

        const assigneeExists = await User.exists({
          _id: updates.assigneeId,
        }).session(session);

        if (!assigneeExists) {
          throw createError(404, "Assignee not found", "NOT_FOUND");
        }
      }

      // 7. Validate audit actor
      if (typeof actor !== "string" || !actor.trim()) {
        throw createError(400, "Audit actor is required", "VALIDATION_ERROR");
      }

      // 8. Compare old and new values
      const eventsToCreate = [];

      for (const field of requestedFields) {
        const oldValue = ticket[field];
        const newValue = updates[field];

        const oldComparable =
          field === "assigneeId" ? (oldValue?.toString() ?? null) : oldValue;

        const newComparable =
          field === "assigneeId" ? (newValue?.toString() ?? null) : newValue;

        // Skip fields that have not changed
        if (oldComparable === newComparable) {
          continue;
        }

        // Create an audit event
        eventsToCreate.push({
          ticketId: ticket._id,
          field,
          oldValue: oldValue ?? null,
          newValue: newValue ?? null,
          actor: actor.trim(),
        });

        // Update the ticket field
        ticket[field] = newValue;
      }

      // 9. Human override protection
      const categoryChanged = eventsToCreate.some(
        (event) => event.field === "category",
      );

      if (categoryChanged) {
        ticket.isHumanOverride = true;
      }

      // 10. Determine whether the ticket was reviewed
      const statusEvent = eventsToCreate.find(
        (event) => event.field === "status",
      );

      const statusChangedFromOpen = statusEvent?.oldValue === "OPEN";

      if (categoryChanged || statusChangedFromOpen) {
        ticket.isReviewed = true;
      }

      // 11. Save ticket and audit events
      if (eventsToCreate.length > 0) {
        await ticket.save({ session });

        await TicketEvent.insertMany(eventsToCreate, {
          session,
        });
      }

      updatedTicket = ticket;

      // 12. Fetch complete audit history
      ticketEvents = await TicketEvent.find({
        ticketId: ticket._id,
      })
        .sort({ createdAt: 1 })
        .session(session);
    });

    // 13. Return updated ticket and audit history
    return {
      ticket: updatedTicket,
      events: ticketEvents,
    };
  } finally {
    // 14. Always close the session
    await session.endSession();
  }
};
