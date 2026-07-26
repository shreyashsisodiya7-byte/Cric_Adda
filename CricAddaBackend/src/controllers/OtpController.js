import nodemailer from "nodemailer";
import OtpModel from "../models/OtpModel.js";
import userModel from "../models/UserModels.js";

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sendEmailOtp = async (email, otp, purpose) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const subjects = {
    signup:           "Verify your CricAdda account",
    login:            "Your CricAdda login OTP",
    "forgot-password": "Reset your CricAdda password",
  };

  const messages = {
    signup:           "Verify your email to create your account.",
    login:            "Use this OTP to log in to your account.",
    "forgot-password": "Use this OTP to reset your password.",
  };

  await transporter.sendMail({
    from: `"CricAdda" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjects[purpose],
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0B1220;color:#fff;border-radius:12px">
        <h2 style="color:#60a5fa;margin-bottom:8px">🏏 CricAdda</h2>
        <p style="color:#9ca3af;margin-bottom:24px">${messages[purpose]}</p>
        <div style="background:#1e293b;border-radius:8px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:bold;color:#a78bfa">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">
          This OTP expires in 10 minutes. Do not share it with anyone.
        </p>
      </div>
    `,
  });
};

// POST /user/send-otp
// Body: { email, purpose: "signup" | "login" | "forgot-password" }
export const sendOtpController = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ message: "Email and purpose are required" });
    }
    if (!["signup", "login", "forgot-password"].includes(purpose)) {
      return res.status(400).json({ message: "Invalid purpose" });
    }

    // login & forgot-password: user must exist
    if (purpose === "login" || purpose === "forgot-password") {
      const user = await userModel.findOne({ Email: email });
      if (!user) {
        return res.status(404).json({ message: "No account found with this email" });
      }
    }

    // signup: email must not be taken
    if (purpose === "signup") {
      const existing = await userModel.findOne({ Email: email });
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }
    }

    await OtpModel.deleteMany({ identifier: email, purpose });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpModel.create({ identifier: email, otp, type: "email", purpose, expiresAt });

    await sendEmailOtp(email, otp, purpose);

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("sendOtp error:", err);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

// POST /user/verify-otp
// Body: { email, otp, purpose }
export const verifyOtpController = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res.status(400).json({ message: "Email, OTP, and purpose are required" });
    }

    const record = await OtpModel.findOne({ identifier: email, otp, purpose });
    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    await OtpModel.updateOne({ _id: record._id }, { verified: true });

    return res.status(200).json({ message: "OTP verified successfully", verified: true });
  } catch (err) {
    console.error("verifyOtp error:", err);
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};