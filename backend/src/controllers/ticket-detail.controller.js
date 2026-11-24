import { getTicketDetailService } from "../services/ticket-detail.service.js";

export const getTicketDetail = async (req, res, next) => {
  try {
    const result = await getTicketDetailService(req.params.id);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
