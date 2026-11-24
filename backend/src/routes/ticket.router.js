import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { importTicket } from "../controllers/ticket.controller.js";
import { updateTicket } from "../controllers/ticket-update.controller.js";
const ticketRouter=express.Router();

ticketRouter.post("/import",authenticate,importTicket);
ticketRouter.patch("/:id", authenticate, updateTicket);

export default ticketRouter;