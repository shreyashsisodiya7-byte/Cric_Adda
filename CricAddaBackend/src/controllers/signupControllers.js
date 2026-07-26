import bcrypt from "bcrypt";
import userModel from "../models/UserModels.js";
import Player from "../models/PlayerModels.js";
import OtpModel from "../models/OtpModel.js";
import jwt from "jsonwebtoken";
import { cascadeDeleteUser } from "./DeleteController.js";

export const deleteUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    await cascadeDeleteUser(userId);
    return res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.log("Delete error:", err);
    res.status(500).json({ success: false, message: "Error deleting account" });
  }
};

export const registerUserController = async (req, res) => {
  try {
    const { Fullname, Email, Password } = req.body;

    // Check OTP was verified
    const otpRecord = await OtpModel.findOne({ identifier: Email, purpose: "signup", verified: true });
    if (!otpRecord) {
      return res.status(403).json({ message: "OTP verification required before signup" });
    }

    // Check email uniqueness
    const UserExists = await userModel.findOne({ Email });
    if (UserExists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Check name uniqueness (case-insensitive)
    const nameExists = await Player.findOne({
      name: { $regex: `^${Fullname.trim()}$`, $options: "i" },
    });
    if (nameExists) {
      return res.status(409).json({ message: "This name is already taken. Please choose a different name." });
    }

    const HashPassword = await bcrypt.hash(Password, 10);

    const user = await userModel.create({ Fullname, Email, Password: HashPassword });

    await Player.create({
      _id: user._id,
      name: Fullname,
      photo: "",
      userType: "Player",
      role: "🏏 Batsman",
      city: "",
      fee: 0,
      about: "",
      status: "Available",
      stats: { matches: 0, runs: 0, wickets: 0 },
      availability: Array(10).fill(false),
    });

    // Clean up used OTP
    await OtpModel.deleteMany({ identifier: Email, purpose: "signup" });

    const token = jwt.sign(
      { userId: user._id, Email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "User registered successfully", token, user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error", success: false, message: "Signup failed" });
  }
};

export default registerUserController;