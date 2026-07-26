import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
      required: true,
    },
    tournamentName: { type: String, required: true },

    // Owner who sends the invite
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "player",
      required: true,
    },
    ownerName: { type: String, required: true },

    // Player being invited
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "player",
      required: true,
    },
    playerName: { type: String, required: true },

    message: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },

    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent duplicate invites for same player + tournament
inviteSchema.index({ tournamentId: 1, playerId: 1 }, { unique: true });

export default mongoose.model("invite", inviteSchema);