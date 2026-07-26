import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: String,
  photo: { type: String, default: "" },
  userType: String,
  role: String,
  city: String,
  fee: Number,
  note: String,
  about: String,
  status: String,

  stats: {
    matches:      Number,
    runs:         Number,
    ballsFaced:   Number,
    wickets:      Number,
    oversBowled:  Number,
    runsConceded: Number,
    catches:      Number,
  },

  availability: {
    type: [Boolean],
    default: Array(10).fill(false),
  },

  // ── Owner trust score ───────────────────────────────────────────────────────
  // Only relevant when userType === "Owner".
  // Increases by 10 each time the owner submits post-match stats.
  // Shown as a badge on the owner's profile / booking cards.
  trustScore: { type: Number, default: 0 },

}, { timestamps: true });

export default mongoose.model("player", playerSchema);