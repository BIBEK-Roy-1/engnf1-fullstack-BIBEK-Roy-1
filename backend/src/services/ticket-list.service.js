import Ticket from "../models/ticket.model.js";
const TICKET_CATEGORIES = [
  "BILLING",
  "BUG",
  "FEATURE_REQUEST",
  "LOGIN",
  "DELIVERY",
];

const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const createError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const parsePositiveInteger = (value, field, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (
    typeof value !== "string" ||
    !/^[0-9]+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < 1
  ) {
    throw createError(
      `${field} must be a positive integer`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return Number(value);
};

export const validateTicketListQuery = (query) => {
  const { status, category, priority, q, page, limit } = query;

  if (
    status !== undefined &&
    (typeof status !== "string" || !TICKET_STATUSES.includes(status))
  ) {
    throw createError("Invalid ticket status", 400, "VALIDATION_ERROR");
  }

  if (
    category !== undefined &&
    (typeof category !== "string" || !TICKET_CATEGORIES.includes(category))
  ) {
    throw createError("Invalid ticket category", 400, "VALIDATION_ERROR");
  }

  if (
    priority !== undefined &&
    (typeof priority !== "string" || !TICKET_PRIORITIES.includes(priority))
  ) {
    throw createError("Invalid ticket priority", 400, "VALIDATION_ERROR");
  }

  if (q !== undefined && typeof q !== "string") {
    throw createError("Search query must be a string", 400, "VALIDATION_ERROR");
  }

  return {
    status,
    category,
    priority,
    q: q?.trim() || "",
    page: parsePositiveInteger(page, "page", 1),
    limit: parsePositiveInteger(limit, "limit", 10),
  };
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const buildTicketFilter = ({ status, category, priority, q }) => {
  const filter = {};

  // Exact-match filters
  if (status) {
    filter.status = status;
  }

  if (category) {
    filter.category = category;
  }

  if (priority) {
    filter.priority = priority;
  }

  // Search subject OR body
  if (q) {
    const safeSearch = escapeRegex(q);

    filter.$or = [
      { subject: { $regex: safeSearch, $options: "i" } },
      { body: { $regex: safeSearch, $options: "i" } },
    ];
  }

  return filter;
};

export const getTicketsService = async (query) => {
  // 1. Validate query parameters
  const filters = validateTicketListQuery(query);

  // 2. Build MongoDB filter
  const mongoFilter = buildTicketFilter(filters);

  // 3. Calculate pagination
  const { page, limit } = filters;
  const skip = (page - 1) * limit;

  // 4. Fetch tickets and total count together
  const [tickets, total] = await Promise.all([
    Ticket.find(mongoFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),

    Ticket.countDocuments(mongoFilter),
  ]);

  // 5. Return paginated response
  return {
    data: tickets,
    page,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};
