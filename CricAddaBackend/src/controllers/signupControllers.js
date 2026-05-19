import bcrypt from "bcrypt";
import userModel from "../models/UserModels.js";
import Player from "../models/PlayerModels.js";
import jwt from "jsonwebtoken";

export const deleteUserController = async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete user and their player profile
    await userModel.findByIdAndDelete(userId);
    await Player.findByIdAndDelete(userId);

    return res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.log("Delete error:", err);
    res.status(500).json({ success: false, message: "Error deleting account" });
  }
};
export const registerUserController = async (req, res) => {
  try {
    const { Fullname, Email, Password } = req.body;

    //   Check user exists
    const UserExists = await userModel.findOne({ Email });
    if (UserExists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    //  Hash password
    const HashPassword = await bcrypt.hash(Password, 10);

    //  Create user
    const user = await userModel.create({
      Fullname,
      Email,
      Password: HashPassword,
    });

    //  Create player profile
    await Player.create({
      _id: user._id,
      name: Fullname,
      photo: "", // 👈 image field
      userType: "Player",
      role: "🏏 Batsman",
      city: "",
      fee: 0,
      note: "",
      about: "",
      status: "Available",
      stats: { matches: 0, runs: 0, wickets: 0 },
      availability: Array(10).fill(false), // ✅ FIXED
    });

    //  Generate token
    const token = jwt.sign(
      { userId: user._id, Email: user.Email },
      process.env.JWT_SECRET ,
      { expiresIn: "7d" }
    );

    //  Send response ONCE
    res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "server error",
      success: false,
      message: "Signup failed",
    });
  }
  // Add this new export at the bottom of signupControllers.js


  
};

export default registerUserController;