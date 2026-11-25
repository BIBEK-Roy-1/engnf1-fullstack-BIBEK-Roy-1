import Resource from "../models/resource.model.js";
import Booking from "../models/booking.model.js";
import { getTicketStats } from "./stats.service.js";

export const getAdminStats = async () => {
  const activeResources = await Resource.countDocuments({
    isActive: true,
  });
  const bookingStatusCounts = await Booking.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
    },
  },
]);
const statuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

const bookingsByStatus = Object.fromEntries(
  statuses.map((status) => [status, 0])
);

bookingStatusCounts.forEach(({ _id, count }) => {
  bookingsByStatus[_id] = count;
});
const topResources = await Booking.aggregate([
  {
    $match: {
      status: { $in: ["PENDING", "APPROVED"] },
    },
  },
  {
    $group: {
      _id: "$resourceId",
      bookingCount: { $sum: 1 },
    },
  },
  {
    $sort: {
      bookingCount: -1,
    },
  },
  {
    $limit: 3,
  },
  {
    $lookup: {
      from: "resources",
      localField: "_id",
      foreignField: "_id",
      as: "resource",
    },
  },
  {
    $unwind: "$resource",
  },
  {
    $project: {
      _id: 0,
      resourceId: "$_id",
      name: "$resource.name",
      type: "$resource.type",
      bookingCount: 1,
    },
  },
]);

const ticketStats = await getTicketStats();

return {
  activeResources,
  bookingsByStatus,
  topResources,
  ticketStats,
};
};