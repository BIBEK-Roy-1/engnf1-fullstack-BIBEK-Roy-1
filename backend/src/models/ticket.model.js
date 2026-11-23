import mongoose from "mongoose";

// Ticket enums
const TICKET_CATEGORIES = [
    "BILLING",
    "BUG",
    "FEATURE_REQUEST",
    "LOGIN",
    "DELIVERY"
];

const TICKET_PRIORITIES = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT"
];

const TICKET_STATUSES = [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED"
];
export const ticketSchema=new mongoose.Schema(
    {
         externalId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
         subject: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 150
        },
         body: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 2000
        },
        autoCategory: {
            type: String,
            required: true,
            enum: TICKET_CATEGORIES,
            immutable: true
        },
        category: {
            type: String,
            required: true,
            enum: TICKET_CATEGORIES
        },
        isHumanOverride: {
            type: Boolean,
            default: false
        },
        priority: {
            type: String,
            required: true,
            enum: TICKET_PRIORITIES
        },
        status: {
            type: String,
            required: true,
            enum: TICKET_STATUSES,
            default: "OPEN"
        },
        assigneeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        isReviewed: {
            type: Boolean,
            default: false
        }
        },
        {
        timestamps: true
    }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;