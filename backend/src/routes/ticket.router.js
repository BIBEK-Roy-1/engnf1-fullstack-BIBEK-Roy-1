import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { importTicket } from "../controllers/ticket.controller.js";
import { updateTicket } from "../controllers/ticket-update.controller.js";
import { getTickets } from "../controllers/ticket-list.controller.js";
import { getTicketDetail } from "../controllers/ticket-detail.controller.js";
const ticketRouter=express.Router();

ticketRouter.post("/import",authenticate,importTicket);
ticketRouter.get("/", authenticate, getTickets);
ticketRouter.get("/:id",authenticate,getTicketDetail);
ticketRouter.patch("/:id", authenticate, updateTicket);



export default ticketRouter;