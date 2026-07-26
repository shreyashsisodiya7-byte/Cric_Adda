import express from "express";
import {
  sendMessage,
  getMessagesForBooking,
  getConversationsForUser,
  checkBlock,
  blockUser,
  unblockUser,
} from "../controllers/MessageControllers.js";
import { verifyToken } from "../middlerware/authMiddleware.js";

const router = express.Router();

router.post("/send", sendMessage);
router.get("/booking/:bookingId", getMessagesForBooking);
router.get("/conversations/:userId", getConversationsForUser);

router.get("/block/check", verifyToken, checkBlock);
router.post("/block", verifyToken, blockUser);
router.delete("/block/:blockedId", verifyToken, unblockUser);

export default router;