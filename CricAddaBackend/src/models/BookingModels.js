import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  // Owner/Team requesting the player
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "player",
    required: true,
  },
  ownerName: { type: String, required: true },
  ownerCity: String,

  // Player being requested
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "player",
    required: true,
  },
  playerName: { type: String, required: true },

  // Booking details
  eventName: { type: String, required: true },
  eventDate:  { type: Date,   required: true },
  eventLocation: String,
  eventType: {
    type: String,
    enum: ["tournament", "practice", "match", "trial"],
    default: "match",
  },

  // Message from owner
  message: { type: String, default: "" },

  // Booking status
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  // Player's response message
  playerResponse: { type: String, default: "" },

  // Timeline
  createdAt:   { type: Date, default: Date.now },
  respondedAt: Date,

  // Additional info
  fee:   Number,
  notes: String,

  // ── Post-match stats obligation ─────────────────────────────────────────────
  // Once eventDate passes and booking is accepted, owner must fill match stats
  // before they can make any new booking request.
  statsSubmitted: { type: Boolean, default: false },

  // The stats the owner recorded for this player in this match
  matchStats: {
    runs:         { type: Number, default: 0 },
    ballsFaced:   { type: Number, default: 0 },
    wickets:      { type: Number, default: 0 },
    oversBowled:  { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    catches:      { type: Number, default: 0 },
    playerRating: { type: Number, min: 1, max: 5, default: null }, // 1-5 star rating for this match
    notes:        { type: String, default: "" },
  },

  statsSubmittedAt: Date,
}, { timestamps: true });

export default mongoose.model("booking", bookingSchema);