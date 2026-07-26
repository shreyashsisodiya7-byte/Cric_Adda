
import express from "express";
import {
  deleteMessage,
  blockUser,
  unblockUser,
  checkBlock,
  sendMessageWithBlockCheck,
  deleteSquadChatMessage,
  blockFromSquadChat,
} from "../controllers/ChatControllers.js";

const router = express.Router();

// ── Individual chat 
router.post("/send", sendMessageWithBlockCheck);

// Soft-delete a direct message
router.delete("/message/:messageId", deleteMessage);

// ── Block / Unblock ──────────────────────────────────────────────────────────
router.post("/block", blockUser);
router.delete("/block/:blockedId", unblockUser);
router.get("/block/check", checkBlock);

// ── Squad chat ───────────────────────────────────────────────────────────────
// Delete a message from squad/tournament group chat
router.delete("/squad/:tournamentId/message/:messageId", deleteSquadChatMessage);

// Owner blocks a player from posting in squad chat
router.put("/squad/:tournamentId/block/:blockedPlayerId", blockFromSquadChat);

export default router;