

import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    // The player being rated
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "player",
      required: true,
    },
    playerName: { type: String, required: true },

    // The hire owner who rates (must have an accepted booking with this player)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "player",
      required: true,
    },
    ownerName: { type: String, required: true },

    // The booking this rating is tied to
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      required: true,
    },

    // 1–5 star rating
    stars: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    // Optional written review
    review: { type: String, default: "", maxlength: 500 },

    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One rating per booking (owner can only rate once per hire)
ratingSchema.index({ bookingId: 1, ownerId: 1 }, { unique: true });

export default mongoose.model("rating", ratingSchema);