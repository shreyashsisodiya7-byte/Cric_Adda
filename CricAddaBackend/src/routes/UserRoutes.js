import express from "express";
import registerUserController from "../controllers/signupControllers.js";
import loginUserController from "../controllers/loginController.js";
import { sendOtpController, verifyOtpController } from "../controllers/OtpController.js";
import googleAuthController from "../controllers/googleAuthController.js";
import { verifyToken } from "../middlerware/authMiddleware.js";
import { deleteUserController } from "../controllers/signupControllers.js";
import {
  changePasswordController,
  verifyPasswordController,
  forgotPasswordController,
} from "../controllers/PasswordController.js";

const Router = express.Router();

// OTP routes
Router.post("/send-otp", sendOtpController);
Router.post("/verify-otp", verifyOtpController);

// Google OAuth (pass { credential } for login, { credential, password } for new signup)
Router.post("/google", googleAuthController);

// Standard auth
Router.post("/Signup", registerUserController);
Router.post("/login", loginUserController);

// Forgot password (no token needed — verified via OTP)
Router.post("/forgot-password", forgotPasswordController);

// Account management (protected)
Router.delete("/delete/:userId", verifyToken, deleteUserController);
Router.post("/change-password", verifyToken, changePasswordController);
Router.post("/verify-password", verifyToken, verifyPasswordController);

export default Router;