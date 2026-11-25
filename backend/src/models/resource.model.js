import mongoose from "mongoose";
const Types = ["ROOM", "LAB", "EQUIPMENT"];
export const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 60,
      lowercase: true,
    },
    type: {
      type: String,
      enum: Types,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 500,
      validate: Number.isInteger, //ensures that the capacity is a whole number, not a decimal.
    },
    description: {
      type: String,
      default: null,
      maxlength: 300,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    bookingLockVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
