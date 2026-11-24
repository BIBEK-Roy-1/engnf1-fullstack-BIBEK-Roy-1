import { importTicketService } from "../services/ticket.service.js";


export const importTicket=async (req,res,next)=>{
    try{
        const result=await importTicketService(req.body?.tickets);

        return res.status(201).json({
            success: true,
            message: "Ticket imported successfully",
            ...result
        })
    }catch(error){
        next(error);
    }
}