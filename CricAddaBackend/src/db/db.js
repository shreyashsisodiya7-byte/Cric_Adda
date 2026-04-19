import mongoose from "mongoose";

async function connect() {
  try {
    await mongoose.connect("mongodb://localhost:27017/CricAddaBackend");
    console.log("DB connected");
  } catch (err) {
    console.log(err);
  }
}

export default connect;
