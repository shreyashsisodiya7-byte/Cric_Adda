import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: String,
  photo: {
    type: String,
    default: "",
  },
  userType: String,
  role: String,
  city: String,
  fee: Number,
  note: String,
  about: String,
  status: String,
  stats: {
    matches: Number,
    runs: Number,
    wickets: Number,
  },
  availability: {
    type: [Boolean],
    default: Array(10).fill(false),
  },
}, { timestamps: true });

export default mongoose.model("player", playerSchema);
