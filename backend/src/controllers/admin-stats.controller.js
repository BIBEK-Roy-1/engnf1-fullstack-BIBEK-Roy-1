import { getAdminStats } from "../services/admin-stats.service.js";

export const getAdminStatsController = async (req, res, next) => {
  try {
    const stats = await getAdminStats();

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};
