import { OAuth2Client } from "google-auth-library";
import userModel from "../models/UserModels.js";
import Player from "../models/PlayerModels.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuthController = async (req, res) => {
  try {
    const { credential, password } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user already exists
    let user = await userModel.findOne({ Email: email });

    if (!user) {
      // ── NEW USER ──
      // Password is required for new Google sign-ups
      if (!password) {
        // Tell the frontend to show the password creation step
        return res.status(200).json({
          needsPassword: true,
          email,
          name,
          picture,
          message: "Please set a password to complete your registration.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Check name uniqueness
      const nameExists = await Player.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
      });
      if (nameExists) {
        return res.status(409).json({
          needsPassword: true,
          nameTaken: true,
          email,
          picture,
          message: "This Google account name is already taken. Please contact support or use a different account.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await userModel.create({
        Fullname: name,
        Email: email,
        Password: hashedPassword,
        Photo: picture,
      });

      await Player.create({
        _id: user._id,
        name: name,
        photo: picture || "",
        userType: "Player",
        role: "🏏 Batsman",
        city: "",
        fee: 0,
        note: "",
        about: "",
        status: "Available",
        stats: { matches: 0, runs: 0, wickets: 0 },
        availability: Array(10).fill(false),
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, Email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const safeUser = user.toObject();
    delete safeUser.Password;

    return res.status(200).json({
      message: "Google login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Google authentication failed", error: err.message });
  }
};

export default googleAuthController;