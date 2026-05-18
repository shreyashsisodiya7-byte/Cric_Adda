import userModel from "../models/UserModels.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const loginUserController = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }

    const user = await userModel.findOne({ Email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(Password, user.Password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, Email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    const { Password, ...safeUser } = user.toObject();
    res.json({ user: safeUser });
    return res
      .status(200)
      .json({ message: "Login successful", token, user: safeUser });
  } catch (err) {
    console.log("login error:", err);
    res.status(500).json({ message: "Error during login", error: err.message });
  }
};

export default loginUserController;
