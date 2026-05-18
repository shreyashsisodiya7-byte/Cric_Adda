import express from "express";
import { sendMessage, getMessagesForBooking, getConversationsForUser } from "../controllers/MessageControllers.js";

const router = express.Router();

// Send a message for a booking
router.post("/send", sendMessage);

// Get all messages for a specific booking
router.get("/booking/:bookingId", getMessagesForBooking);

// Get all conversations (active bookings) for a user
router.get("/conversations/:userId", getConversationsForUser);

export default router;
