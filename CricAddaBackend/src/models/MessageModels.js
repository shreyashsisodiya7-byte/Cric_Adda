import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  // Reference to booking
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "booking",
    required: true,
  },
  
  // Participants
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "player",
    required: true,
  },
  senderName: String,
  
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "player",
    required: true,
  },
  receiverName: String,
  
  // Message content
  text: {
    type: String,
    required: true,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model("message", messageSchema);
