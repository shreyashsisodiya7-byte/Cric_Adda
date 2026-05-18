import mongoose from "mongoose";

async function connect() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/CricAddaBackend";
    await mongoose.connect(uri);
    console.log("DB connected");
  } catch (err) {
     console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
  }
}

export default connect;
