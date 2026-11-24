import { updateTicketService } from "../services/ticket-update.service.js";

export const updateTicket = async (req, res, next) => {
  try {
    // Get actor from X-Agent header or logged-in user's email
    const actor = req.get("X-Agent")?.trim() || req.user.email;

    const result = await updateTicketService(req.params.id, req.body, actor);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
