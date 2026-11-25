import Ticket from "../models/ticket.model.js";

const CATEGORIES = ["BILLING", "BUG", "FEATURE_REQUEST", "LOGIN", "DELIVERY"];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const getTicketStats = async () => {
  const [
    categoryCounts,
    priorityCounts,
    statusCounts,
    reviewedCount,
    agreementResult,
    totalTickets,
  ] = await Promise.all([
    Ticket.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),

    Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),

    Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

    Ticket.countDocuments({ isReviewed: true }),

    Ticket.aggregate([
      {
        $group: {
          _id: null,
          agreementCount: {
            $sum: {
              $cond: [{ $eq: ["$category", "$autoCategory"] }, 1, 0],
            },
          },
        },
      },
    ]),

    Ticket.countDocuments(),
  ]);

  const formatCounts = (values, keys) => {
    const result = Object.fromEntries(keys.map((key) => [key, 0]));

    values.forEach(({ _id, count }) => {
      result[_id] = count;
    });

    return result;
  };

  const agreementCount = agreementResult[0]?.agreementCount ?? 0;

  const modelAgreementRate =
    totalTickets === 0
      ? 0
      : Number(((agreementCount / totalTickets) * 100).toFixed(2));

  return {
    byCategory: formatCounts(categoryCounts, CATEGORIES),
    byPriority: formatCounts(priorityCounts, PRIORITIES),
    byStatus: formatCounts(statusCounts, STATUSES),
    reviewedCount,
    modelAgreementRate,
  };
};
