import bcrypt from "bcrypt";
import userModel from "../models/UserModels.js";
import OtpModel from "../models/OtpModel.js";

// ── Change password (user knows current password) ─────────────────────────────
export const changePasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.Password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.findByIdAndUpdate(userId, { Password: hashed });

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error while changing password" });
  }
};

// ── Forgot password (reset via OTP — no auth token needed) ───────────────────
// Step 1: POST /user/send-otp       { email, purpose: "forgot-password" }
// Step 2: POST /user/verify-otp     { email, otp, purpose: "forgot-password" }
// Step 3: POST /user/forgot-password { email, newPassword }
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // OTP must have been verified first
    const otpRecord = await OtpModel.findOne({
      identifier: email,
      purpose: "forgot-password",
      verified: true,
    });
    if (!otpRecord) {
      return res.status(403).json({ message: "OTP verification required before resetting password" });
    }

    const user = await userModel.findOne({ Email: email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.findByIdAndUpdate(user._id, { Password: hashed });

    // Clean up used OTP
    await OtpModel.deleteMany({ identifier: email, purpose: "forgot-password" });

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error while resetting password" });
  }
};

// ── Verify password before account delete ────────────────────────────────────
export const verifyPasswordController = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Verify password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};