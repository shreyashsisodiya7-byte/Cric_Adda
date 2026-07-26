import express from "express";
import upload from "../middlerware/upload.js";
import { verifyToken, optionalVerifyToken } from "../middlerware/authMiddleware.js";
import {
  // Existing
  createTournament,
  getAllTournaments,
  getTournamentById,
  getOwnerTournaments,
  getPlayerTournaments,
  updateTournament,
  updateTournamentStatus,
  deleteTournament,
  requestToJoin,
  approveJoinRequest,
  rejectJoinRequest,
  removeFromSquad,
  bulkAddSquad,
  toggleSubstitute,
  getChatMessages,
  sendChatMessage,
  // NEW: chat delete & block
  deleteChatMessage,
  blockPlayerFromChat,
  unblockPlayerFromChat,
  // NEW: invites
  sendInvite,
  getTournamentInvites,
  getPlayerInvites,
  respondToInvite,
  // NEW: ratings
  ratePlayer,
  getPlayerRatings,
  getAllRatings,
  sendRatingReminder,
} from "../controllers/TournamentControllers.js";

const router = express.Router();

// ── Tournament CRUD ──────────────────────────────────────────────────────────
router.get("/", optionalVerifyToken, getAllTournaments);
router.get("/owner/:ownerId", optionalVerifyToken, getOwnerTournaments);
router.get("/player/:playerId", verifyToken, getPlayerTournaments);

// NEW: player's pending invites — must be BEFORE /:tournamentId to avoid clash
router.get("/invites/player/:playerId", verifyToken, getPlayerInvites);

router.get("/:tournamentId", optionalVerifyToken, getTournamentById);

router.post("/", verifyToken, (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    upload.single("banner")(req, res, next);
  } else {
    next();
  }
}, createTournament);

router.put("/:tournamentId", verifyToken, (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    upload.single("banner")(req, res, next);
  } else {
    next();
  }
}, updateTournament);

router.put("/:tournamentId/status", verifyToken, updateTournamentStatus);
router.delete("/:tournamentId", verifyToken, deleteTournament);

// ── Join Requests ─────────────────────────────────────────────────────────────
router.post("/:tournamentId/join", verifyToken, requestToJoin);
router.put("/:tournamentId/requests/:requestId/approve", verifyToken, approveJoinRequest);
router.put("/:tournamentId/requests/:requestId/reject", verifyToken, rejectJoinRequest);

// ── Squad Management ──────────────────────────────────────────────────────────
router.post("/:tournamentId/squad/bulk", verifyToken, bulkAddSquad);
router.put("/:tournamentId/squad/:squadPlayerId/substitute", verifyToken, toggleSubstitute);
router.delete("/:tournamentId/squad/:squadPlayerId", verifyToken, removeFromSquad);

// ── Tournament Chat ───────────────────────────────────────────────────────────
router.get("/:tournamentId/chat", verifyToken, getChatMessages);
router.post("/:tournamentId/chat", verifyToken, sendChatMessage);
// NEW: delete a message
router.delete("/:tournamentId/chat/:messageId", verifyToken, deleteChatMessage);
// NEW: block / unblock a player from chat (owner only)
router.post("/:tournamentId/chat/block", verifyToken, blockPlayerFromChat);
router.delete("/:tournamentId/chat/block/:playerId", verifyToken, unblockPlayerFromChat);

// ── Invites (Feature 1) ────────────────────────────────────────────────────────
// Owner sends invite to a player from FindPlayers
router.post("/:tournamentId/invites", verifyToken, sendInvite);
// Owner views all invites for their tournament
router.get("/:tournamentId/invites", verifyToken, getTournamentInvites);
// Player responds (accept/decline) to an invite
router.put("/:tournamentId/invites/:inviteId", verifyToken, respondToInvite);

// ── Ratings (Feature 3) ────────────────────────────────────────────────────────
// Owner submits a rating
router.post("/:tournamentId/ratings", verifyToken, ratePlayer);
// Owner views all ratings summary
router.get("/:tournamentId/ratings", verifyToken, getAllRatings);
// Anyone views a specific player's ratings
router.get("/:tournamentId/ratings/:playerId", optionalVerifyToken, getPlayerRatings);
// Player sends rating reminder to owner
router.post("/:tournamentId/ratings/remind", verifyToken, sendRatingReminder);

export default router;
