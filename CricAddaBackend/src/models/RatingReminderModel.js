
import mongoose from "mongoose";

const ratingReminderSchema = new mongoose.Schema(
  {
    // Player sending the reminder
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "player",
      required: true,
    },
    playerName: { type: String, required: true },

    // Owner being reminded
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "player",
      required: true,
    },

    // Which booking this reminder is about
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      required: true,
    },

    status: {
      type: String,
      enum: ["sent", "reviewed"],
      default: "sent",
    },
  },
  { timestamps: true }
);

// Player can only send one reminder per booking
ratingReminderSchema.index({ bookingId: 1, playerId: 1 }, { unique: true });

export default mongoose.model("ratingReminder", ratingReminderSchema);