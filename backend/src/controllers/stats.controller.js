import { getTicketStats } from "../services/stats.service.js";

export const getTicketStatsController = async (req, res, next) => {
  try {
    const stats = await getTicketStats();

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};