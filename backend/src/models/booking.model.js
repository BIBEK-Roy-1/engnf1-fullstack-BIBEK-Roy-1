
import mongoose from "mongoose";

const BOOKING_STATUSES = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "CANCELLED"
];

export const bookingSchema = new mongoose.Schema(
    {
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resource",
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            default: null
        },

        startTime: {
            type: Date,
            required: true
        },

        endTime: {
            type: Date,
            required: true
        },

        purpose: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 200
        },

        status: {
            type: String,
            enum: BOOKING_STATUSES,
            required: true,
            default: "PENDING"
        },

        decisionNote: {
            type: String,
            default: null,
            trim: true,
            minlength: 5,
            maxlength: 200
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        },
        toJSON: {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
}
    }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

// NOT validating yet :
// - All timestamps must be UTC.
// - Bookings must follow a 30-minute time grid.
// - Duration must be 30–240 minutes.
// - Start time must be in the future and within 30 days.
// - Overlapping bookings must be prevented.
// - Only PENDING and APPROVED bookings block availability.
// - Concurrent booking requests must be handled atomically.
