
import { getTicketsService } from "../services/ticket-list.service.js";

export const getTickets = async (req, res, next) => {
    try {
        const result = await getTicketsService(req.query);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
