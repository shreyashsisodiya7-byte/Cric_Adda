import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  // Owner/Team requesting the player
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "player",
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  ownerCity: String,
  
  // Player being requested
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "player",
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  
  // Booking details
  eventName: {
    type: String,
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  eventLocation: String,
  eventType: {
    type: String,
    enum: ["tournament", "practice", "match", "trial"],
    default: "match",
  },
  
  // Message from owner
  message: {
    type: String,
    default: "",
  },
  
  // Booking status
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  
  // Player's response message
  playerResponse: {
    type: String,
    default: "",
  },
  
  // Timeline
  createdAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: Date,
  
  // Additional info
  fee: Number,
  notes: String,
}, { timestamps: true });

export default mongoose.model("booking", bookingSchema);
