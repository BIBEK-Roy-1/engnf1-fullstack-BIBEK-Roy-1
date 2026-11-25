import Resource from "../models/resource.model.js";
import AppError from "../utils/app-error.js";
import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import { isValidUTCTimestamp } from "../utils/booking-validation.js";

export const getResources = async (queryParams, user) => {
  const { search, type, minCapacity, page = 1, pageSize = 10 } = queryParams;

  // Validate pagination
  const currentPage = Number(page);
  const limit = Number(pageSize);

  if (
    !Number.isInteger(currentPage) ||
    !Number.isInteger(limit) ||
    currentPage < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    throw new AppError(
      "Invalid pagination parameters.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const filter = {};

  // USER can only see active resources
  if (user.role === "USER") {
    filter.isActive = true;
  }

  // Filter by resource type
  if (type !== undefined) {
    const allowedTypes = ["ROOM", "LAB", "EQUIPMENT"];

    if (!allowedTypes.includes(type)) {
      throw new AppError("Invalid resource type.", 400, "VALIDATION_ERROR");
    }

    filter.type = type;
  }

  // Filter by minimum capacity
  if (minCapacity !== undefined) {
    const capacity = Number(minCapacity);

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
      throw new AppError("Invalid minimum capacity.", 400, "VALIDATION_ERROR");
    }

    filter.capacity = { $gte: capacity };
  }

  // Search by resource name
  if (search !== undefined) {
    if (typeof search !== "string" || search.trim().length === 0) {
      throw new AppError("Invalid search query.", 400, "VALIDATION_ERROR");
    }

    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.name = { $regex: escapedSearch, $options: "i" };
  }

  const skip = (currentPage - 1) * limit;

  const [resources, total] = await Promise.all([
    Resource.find(filter).sort({ name: 1 }).skip(skip).limit(limit),

    Resource.countDocuments(filter),
  ]);

  return {
    data: resources,
    page: currentPage,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

export const getResourceById = async (resourceId, user) => {
  // Invalid IDs return 404
  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    throw new AppError("Resource not found.", 404, "NOT_FOUND");
  }

  const resource = await Resource.findById(resourceId);

  // USER cannot access inactive resources
  if (!resource || (user.role === "USER" && !resource.isActive)) {
    throw new AppError("Resource not found.", 404, "NOT_FOUND");
  }

  return resource;
};

export const createResource = async ({
  name,
  type,
  capacity,
  description,
  isActive,
}) => {
  // Validate required fields
  if (!name || !type || capacity === undefined) {
    throw new AppError(
      "Name, type, and capacity are required.",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Validate name
  if (
    typeof name !== "string" ||
    name.trim().length < 3 ||
    name.trim().length > 60
  ) {
    throw new AppError("Invalid resource name.", 400, "VALIDATION_ERROR");
  }

  // Validate type
  const allowedTypes = ["ROOM", "LAB", "EQUIPMENT"];

  if (!allowedTypes.includes(type)) {
    throw new AppError("Invalid resource type.", 400, "VALIDATION_ERROR");
  }

  // Validate capacity
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
    throw new AppError("Invalid capacity.", 400, "VALIDATION_ERROR");
  }

  // Validate optional fields
  if (
    description !== undefined &&
    description !== null &&
    (typeof description !== "string" || description.length > 300)
  ) {
    throw new AppError("Invalid description.", 400, "VALIDATION_ERROR");
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw new AppError("Invalid isActive value.", 400, "VALIDATION_ERROR");
  }

  // Create resource
  try {
    return await Resource.create({
      name: name.trim().toLowerCase(),
      type,
      capacity,
      description: description?.trim() || null,
      isActive: isActive ?? true,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "A resource with this name already exists.",
        409,
        "CONFLICT",
      );
    }

    throw error;
  }
};

export const updateResource = async (resourceId, updates) => {
  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    throw new AppError("Resource not found.", 404, "NOT_FOUND");
  }

  const resource = await Resource.findById(resourceId);

  if (!resource) {
    throw new AppError("Resource not found.", 404, "NOT_FOUND");
  }

  const allowedFields = ["name", "type", "capacity", "description", "isActive"];

  const fields = Object.keys(updates);

  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.includes(field))
  ) {
    throw new AppError("Invalid update fields.", 400, "VALIDATION_ERROR");
  }

  if (updates.name !== undefined) {
    if (
      typeof updates.name !== "string" ||
      updates.name.trim().length < 3 ||
      updates.name.trim().length > 60
    ) {
      throw new AppError("Invalid resource name.", 400, "VALIDATION_ERROR");
    }

    resource.name = updates.name.trim().toLowerCase();
  }

  if (updates.type !== undefined) {
    if (!["ROOM", "LAB", "EQUIPMENT"].includes(updates.type)) {
      throw new AppError("Invalid resource type.", 400, "VALIDATION_ERROR");
    }

    resource.type = updates.type;
  }

  if (updates.capacity !== undefined) {
    if (
      !Number.isInteger(updates.capacity) ||
      updates.capacity < 1 ||
      updates.capacity > 500
    ) {
      throw new AppError("Invalid capacity.", 400, "VALIDATION_ERROR");
    }

    resource.capacity = updates.capacity;
  }

  if (updates.description !== undefined) {
    if (
      updates.description !== null &&
      (typeof updates.description !== "string" ||
        updates.description.length > 300)
    ) {
      throw new AppError("Invalid description.", 400, "VALIDATION_ERROR");
    }

    resource.description = updates.description?.trim() || null;
  }

  if (updates.isActive !== undefined) {
    if (typeof updates.isActive !== "boolean") {
      throw new AppError("Invalid isActive value.", 400, "VALIDATION_ERROR");
    }

    resource.isActive = updates.isActive;
  }

  try {
    return await resource.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "A resource with this name already exists.",
        409,
        "CONFLICT",
      );
    }

    throw error;
  }
};

export const getResourceAvailability = async (
  resourceId,
  queryParams,
  user,
) => {
  const { from, to } = queryParams;

  // Validate resource ID
  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    throw new AppError("Resource not found.", 404, "NOT_FOUND");
  }

  // Validate required date parameters
  if (!from || !to) {
    throw new AppError(
      "Both from and to timestamps are required.",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Validate ISO UTC timestamps
  if (!isValidUTCTimestamp(from) || !isValidUTCTimestamp(to)) {
    throw new AppError(
      "Invalid ISO 8601 UTC timestamps.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  // Validate date range
  const range = toDate.getTime() - fromDate.getTime();

  if (range <= 0 || range > 7 * 24 * 60 * 60 * 1000) {
    throw new AppError(
      "Date range must be greater than zero and at most 7 days.",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Check resource access
  const resource = await getResourceById(resourceId, user);

  // Find overlapping active bookings
  const bookings = await Booking.find({
    resourceId,
    status: { $in: ["PENDING", "APPROVED"] },
    startTime: { $lt: toDate },
    endTime: { $gt: fromDate },
  })
    .select("startTime endTime status -_id")
    .sort({ startTime: 1 })
    .lean();

  return {
    resourceId: resource.id,
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    bookings,
  };
};
