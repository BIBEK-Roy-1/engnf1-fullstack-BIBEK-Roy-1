import mongoose from "mongoose";

const FIELDS = ["category", "priority", "status", "assigneeId"];
export const ticketEventSchema=new mongoose.Schema(
    {
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
        required: true
            },
    oldValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
        },
    field: {
        type: String,
        enum: FIELDS,
        required: true
            },

    newValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    actor: {
        type: String,
        required: true

    },
},
    {
    timestamps: {
        createdAt: true,
        updatedAt: false
                    }   
    }
    
);

const TicketEvent = mongoose.model("TicketEvent", ticketEventSchema);

export default TicketEvent;