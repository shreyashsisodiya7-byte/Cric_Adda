import Tournament from "../models/TournamentModels.js";
import Player from "../models/PlayerModels.js";

const parseRequirements = (raw) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: CREATE Tournament   POST /tournaments
// ─────────────────────────────────────────────────────────────────────────────
export const createTournament = async (req, res) => {
  try {
    const {
      name, description, format, matchType,
      location, city, pitchType,
      startDate, endDate, registrationDeadline,
      prizePool, runnerUpPrize, momPrize, mosPrize,
      entryFee, maxTeams, maxSquadSize,
      ageGroup, gender, rules, contactInfo,
      ownerId, ownerName,
      playerRequirements, tags,
    } = req.body;

    if (!name || !location || !city || !startDate || !ownerId || !ownerName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, location, city, startDate, ownerId, ownerName",
      });
    }

    const tournament = new Tournament({
      name, description, format, matchType,
      location, city, pitchType,
      startDate, endDate, registrationDeadline,
      prizePool, runnerUpPrize, momPrize, mosPrize,
      entryFee, maxTeams, maxSquadSize,
      ageGroup, gender, rules, contactInfo,
      ownerId, ownerName,
      playerRequirements: parseRequirements(playerRequirements),
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      banner: req.file ? req.file.filename : "",
    });

    await tournament.save();

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      tournament,
    });
  } catch (error) {
    console.error("createTournament error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: GET ALL Tournaments
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTournaments = async (req, res) => {
  try {
    const { city, format, status, search, ageGroup, gender } = req.query;
    const filter = {};

    if (city)     filter.city   = new RegExp(city, "i");
    if (format)   filter.format = format;
    if (status)   filter.status = status;
    if (search)   filter.name   = new RegExp(search, "i");
    if (ageGroup) filter.ageGroup = new RegExp(ageGroup, "i");
    if (gender && gender !== "all") filter.gender = gender;

    const tournaments = await Tournament.find(filter)
      .select("-chat -ratings -ratingReminders")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: tournaments.length, tournaments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: GET single Tournament
// ─────────────────────────────────────────────────────────────────────────────
export const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId)
      .select("-chat -ratings -ratingReminders");
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }
    return res.status(200).json({ success: true, tournament });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: GET tournaments by owner
// ─────────────────────────────────────────────────────────────────────────────
export const getOwnerTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ ownerId: req.params.ownerId })
      .select("-chat -ratings -ratingReminders")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: tournaments.length, tournaments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: GET tournaments a player requested / is in
// Also returns tournaments where player has a pending invite
// ─────────────────────────────────────────────────────────────────────────────
export const getPlayerTournaments = async (req, res) => {
  try {
    const { playerId } = req.params;
    const tournaments = await Tournament.find({
      $or: [
        { "joinRequests.playerId": playerId },
        { "squad.playerId": playerId },
        { "invites.playerId": playerId }, // NEW: include invited tournaments
      ],
    }).select("-chat -ratings -ratingReminders").sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: tournaments.length, tournaments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: UPDATE Tournament
// ─────────────────────────────────────────────────────────────────────────────
export const updateTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const allowed = [
      "name","description","format","matchType","location","city","pitchType",
      "startDate","endDate","registrationDeadline",
      "prizePool","runnerUpPrize","momPrize","mosPrize",
      "entryFee","maxTeams","maxSquadSize",
      "ageGroup","gender","rules","contactInfo","tags","status",
    ];

    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (req.body.playerRequirements !== undefined) {
      updates.playerRequirements = parseRequirements(req.body.playerRequirements);
    }
    if (req.file) updates.banner = req.file.filename;

    const tournament = await Tournament.findByIdAndUpdate(tournamentId, updates, { new: true })
      .select("-chat -ratings -ratingReminders");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    return res.status(200).json({ success: true, message: "Tournament updated", tournament });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: UPDATE STATUS
// ─────────────────────────────────────────────────────────────────────────────
export const updateTournamentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["upcoming", "ongoing", "completed", "cancelled"];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const tournament = await Tournament.findByIdAndUpdate(
      req.params.tournamentId, { status }, { new: true }
    ).select("-chat -ratings -ratingReminders");

    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });
    return res.status(200).json({ success: true, message: "Status updated", tournament });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: DELETE Tournament
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });
    return res.status(200).json({ success: true, message: "Tournament deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: PLAYER — Request to join
// ─────────────────────────────────────────────────────────────────────────────
export const requestToJoin = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { playerId, playerName, playerRole, playerCity, playerPhoto, playerStats, message } = req.body;

    if (!playerId || !playerName) {
      return res.status(400).json({ success: false, message: "playerId and playerName are required" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    if (["completed", "cancelled"].includes(tournament.status)) {
      return res.status(400).json({ success: false, message: "Tournament is not accepting requests" });
    }

    if (tournament.registrationDeadline && new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({ success: false, message: "Registration deadline has passed" });
    }

    if (tournament.squad.some((s) => s.playerId?.toString() === playerId)) {
      return res.status(400).json({ success: false, message: "You are already in the squad" });
    }

    if (tournament.joinRequests.some((r) => r.playerId.toString() === playerId && r.status === "pending")) {
      return res.status(400).json({ success: false, message: "You already have a pending request" });
    }

    // Check if joining via invite
    const invite = tournament.invites.find(
      (i) => i.playerId.toString() === playerId && i.status === "pending"
    );
    const viaInvite = !!invite;

    // Mark invite as accepted if it exists
    if (invite) {
      invite.status = "accepted";
      invite.respondedAt = new Date();
    }

    tournament.joinRequests.push({
      playerId, playerName, playerRole, playerCity, playerPhoto, playerStats, message, viaInvite,
    });
    await tournament.save();

    return res.status(201).json({ success: true, message: "Join request sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: OWNER — Approve request
// ─────────────────────────────────────────────────────────────────────────────
export const approveJoinRequest = async (req, res) => {
  try {
    const { tournamentId, requestId } = req.params;
    const { jerseyNumber, isSubstitute } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    const request = tournament.joinRequests.id(requestId);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request already ${request.status}` });
    }

    if (tournament.squad.length >= tournament.maxSquadSize) {
      return res.status(400).json({ success: false, message: "Squad is full" });
    }

    request.status = "approved";
    request.respondedAt = new Date();

    tournament.squad.push({
      playerId:     request.playerId,
      playerName:   request.playerName,
      playerRole:   request.playerRole,
      playerPhoto:  request.playerPhoto,
      playerStats:  request.playerStats,
      jerseyNumber: jerseyNumber || tournament.squad.filter((s) => !s.isSubstitute).length + 1,
      isSubstitute: isSubstitute === true || isSubstitute === "true",
    });

    await tournament.save();
    const updated = await Tournament.findById(tournamentId).select("-chat -ratings -ratingReminders");
    return res.status(200).json({ success: true, message: "Player approved and added to squad", tournament: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: OWNER — Reject request
// ─────────────────────────────────────────────────────────────────────────────
export const rejectJoinRequest = async (req, res) => {
  try {
    const { tournamentId, requestId } = req.params;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    const request = tournament.joinRequests.id(requestId);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request already ${request.status}` });
    }

    request.status = "rejected";
    request.respondedAt = new Date();
    await tournament.save();

    return res.status(200).json({ success: true, message: "Request rejected" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: OWNER — Remove player from squad
// ─────────────────────────────────────────────────────────────────────────────
export const removeFromSquad = async (req, res) => {
  try {
    const { tournamentId, squadPlayerId } = req.params;
    const requesterId = req.user?.id || req.user?._id;
    const reason = req.body?.reason || req.query?.reason || "";

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Reason for removal is required" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    if (tournament.ownerId?.toString() !== requesterId?.toString()) {
      return res.status(403).json({ success: false, message: "Only the tournament owner can remove squad players" });
    }

    const squadPlayer = tournament.squad.id(squadPlayerId);
    if (!squadPlayer) return res.status(404).json({ success: false, message: "Squad player not found" });

    const playerId = squadPlayer.playerId?.toString();

    // remove the squad player
    squadPlayer.remove();

    // mark any corresponding joinRequest as removed (if present)
    const reqObj = tournament.joinRequests.find((r) => r.playerId?.toString() === playerId && r.status === "approved");
    if (reqObj) {
      reqObj.status = "removed";
      reqObj.removedAt = new Date();
      reqObj.removedBy = requesterId;
      reqObj.removalReason = reason.trim();
    } else {
      // if no prior join request exists, create a removed record for history
      tournament.joinRequests.push({
        playerId: squadPlayer.playerId,
        playerName: squadPlayer.playerName,
        playerRole: squadPlayer.playerRole,
        playerPhoto: squadPlayer.playerPhoto,
        status: "removed",
        removedAt: new Date(),
        removedBy: requesterId,
        removalReason: reason.trim(),
      });
    }

    await tournament.save();

    const updated = await Tournament.findById(tournamentId).select("-chat -ratings -ratingReminders");
    return res.status(200).json({ success: true, message: "Player removed from squad", tournament: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: OWNER — Bulk add squad players
// ─────────────────────────────────────────────────────────────────────────────
export const bulkAddSquad = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { players } = req.body;

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ success: false, message: "players array is required" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    let mainCount = tournament.squad.filter((s) => !s.isSubstitute).length;

    for (const p of players) {
      if (!p.playerName) continue;
      if (p.playerId && tournament.squad.some((s) => s.playerId?.toString() === p.playerId)) continue;
      if (tournament.squad.length >= tournament.maxSquadSize) break;

      const isSub = p.isSubstitute === true || p.isSubstitute === "true";
      tournament.squad.push({
        playerId:     p.playerId || undefined,
        playerName:   p.playerName,
        playerRole:   p.playerRole || "",
        playerPhoto:  p.playerPhoto || "",
        isSubstitute: isSub,
        jerseyNumber: isSub ? undefined : ++mainCount,
      });
    }

    await tournament.save();
    const updated = await Tournament.findById(tournamentId).select("-chat -ratings -ratingReminders");
    return res.status(200).json({ success: true, message: "Squad updated", tournament: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: TOGGLE substitute flag
// ─────────────────────────────────────────────────────────────────────────────
export const toggleSubstitute = async (req, res) => {
  try {
    const { tournamentId, squadPlayerId } = req.params;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    const player = tournament.squad.id(squadPlayerId);
    if (!player) return res.status(404).json({ success: false, message: "Squad player not found" });

    player.isSubstitute = !player.isSubstitute;
    await tournament.save();

    return res.status(200).json({ success: true, message: "Substitute status toggled", tournament });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: TOURNAMENT CHAT — Get messages
// ─────────────────────────────────────────────────────────────────────────────
export const getChatMessages = async (req, res) => {
  try {
    const { tournamentId } = req.params;
   const requesterId = req.user?.userId || req.user?.id || req.user?._id;

    const tournament = await Tournament.findById(tournamentId).select("chat squad ownerId blockedPlayers");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    const isOwner = tournament.ownerId?.toString() === requesterId?.toString();
    const inSquad = tournament.squad.some((s) => s.playerId?.toString() === requesterId?.toString());

    if (!isOwner && !inSquad) {
      return res.status(403).json({ success: false, message: "Only squad members can view the chat" });
    }

    // Return messages; show "[Message deleted]" for soft-deleted ones
    const messages = tournament.chat.map((m) => ({
      _id:        m._id,
      sender:     { _id: m.senderId, name: m.senderName },
      content:    m.isDeleted ? "[Message deleted]" : m.content,
      isDeleted:  m.isDeleted,
      createdAt:  m.createdAt,
    }));

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING: TOURNAMENT CHAT — Send message
// ─────────────────────────────────────────────────────────────────────────────
export const sendChatMessage = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { senderId, senderName, content } = req.body;

    if (!senderId || !senderName || !content?.trim()) {
      return res.status(400).json({ success: false, message: "senderId, senderName, and content are required" });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ success: false, message: "Message too long (max 1000 chars)" });
    }

    const tournament = await Tournament.findById(tournamentId).select("chat squad ownerId maxSquadSize blockedPlayers");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    // NEW: check if sender is blocked
    if (tournament.blockedPlayers.some((id) => id.toString() === senderId)) {
      return res.status(403).json({ success: false, message: "You have been blocked from this chat" });
    }
;
console.log("tournament.ownerId:", tournament.ownerId);
console.log("squad:", tournament.squad.map(s => s.playerId));
    const isOwner = tournament.ownerId?.toString() === senderId?.toString();
    const inSquad = tournament.squad.some((s) => s.playerId?.toString() === senderId?.toString());
    if (!isOwner && !inSquad) {
      return res.status(403).json({ success: false, message: "Only squad members can send messages" });
    }

    tournament.chat.push({ senderId, senderName, content: content.trim() });

    if (tournament.chat.length > 500) {
      tournament.chat = tournament.chat.slice(-500);
    }

    await tournament.save();

    const newMsg = tournament.chat[tournament.chat.length - 1];
    return res.status(201).json({
      success: true,
      message: {
        _id:       newMsg._id,
        sender:    { _id: newMsg.senderId, name: newMsg.senderName },
        content:   newMsg.content,
        isDeleted: false,
        createdAt: newMsg.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: DELETE a chat message (soft delete)
// DELETE /tournaments/:tournamentId/chat/:messageId
// Only the sender OR the owner can delete
// ─────────────────────────────────────────────────────────────────────────────
export const deleteChatMessage = async (req, res) => {
  try {
    const { tournamentId, messageId } = req.params;
    const requesterId = req.user?.id || req.user?._id;

    const tournament = await Tournament.findById(tournamentId).select("chat ownerId");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    const msg = tournament.chat.id(messageId);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    const isOwner   = tournament.ownerId?.toString() === requesterId?.toString();
    const isSender  = msg.senderId?.toString() === requesterId?.toString();

    if (!isOwner && !isSender) {
      return res.status(403).json({ success: false, message: "Not allowed to delete this message" });
    }

    msg.isDeleted = true;
    msg.deletedAt = new Date();
    msg.content   = ""; // clear content for privacy
    await tournament.save();

    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: BLOCK a player from chat
// POST /tournaments/:tournamentId/chat/block
// Body: { playerId }  — only owner can block
// ─────────────────────────────────────────────────────────────────────────────
export const blockPlayerFromChat = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { playerId }     = req.body;
    const requesterId      = req.user?.id || req.user?._id;

    const tournament = await Tournament.findById(tournamentId).select("ownerId blockedPlayers");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    if (tournament.ownerId?.toString() !== requesterId?.toString()) {
      return res.status(403).json({ success: false, message: "Only the tournament owner can block players" });
    }

    if (!tournament.blockedPlayers.some((id) => id.toString() === playerId)) {
      tournament.blockedPlayers.push(playerId);
      await tournament.save();
    }

    return res.status(200).json({ success: true, message: "Player blocked from chat" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: UNBLOCK a player from chat
// DELETE /tournaments/:tournamentId/chat/block/:playerId  — owner only
// ─────────────────────────────────────────────────────────────────────────────
export const unblockPlayerFromChat = async (req, res) => {
  try {
    const { tournamentId, playerId } = req.params;
    const requesterId = req.user?.id || req.user?._id;

    const tournament = await Tournament.findById(tournamentId).select("ownerId blockedPlayers");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    if (tournament.ownerId?.toString() !== requesterId?.toString()) {
      return res.status(403).json({ success: false, message: "Only the tournament owner can unblock players" });
    }

    tournament.blockedPlayers = tournament.blockedPlayers.filter((id) => id.toString() !== playerId);
    await tournament.save();

    return res.status(200).json({ success: true, message: "Player unblocked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// FEATURE 1: TOURNAMENT INVITES
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — Send invite to a player
// POST /tournaments/:tournamentId/invites
// Body: { playerId, playerName, playerRole, playerPhoto, message }
// ─────────────────────────────────────────────────────────────────────────────
export const sendInvite = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { playerId, playerName, playerRole, playerPhoto, message } = req.body;
    const requesterId = req.user?.id || req.user?._id;

    if (!playerId || !playerName) {
      return res.status(400).json({ success: false, message: "playerId and playerName are required" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    if (tournament.ownerId?.toString() !== requesterId?.toString()) {
      return res.status(403).json({ success: false, message: "Only the tournament owner can send invites" });
    }

    // Prevent duplicate pending invite
    if (tournament.invites.some((i) => i.playerId.toString() === playerId && i.status === "pending")) {
      return res.status(400).json({ success: false, message: "Invite already sent to this player" });
    }

    // Prevent inviting someone already in squad
    if (tournament.squad.some((s) => s.playerId?.toString() === playerId)) {
      return res.status(400).json({ success: false, message: "Player is already in the squad" });
    }

    tournament.invites.push({ playerId, playerName, playerRole, playerPhoto, message });
    await tournament.save();

    return res.status(201).json({ success: true, message: "Invite sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — Get all invites for a tournament
// GET /tournaments/:tournamentId/invites
// ─────────────────────────────────────────────────────────────────────────────
export const getTournamentInvites = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const requesterId = req.user?.id || req.user?._id;

    const tournament = await Tournament.findById(tournamentId).select("invites ownerId");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    if (tournament.ownerId?.toString() !== requesterId?.toString()) {
      return res.status(403).json({ success: false, message: "Only the owner can view invites" });
    }

    return res.status(200).json({ success: true, invites: tournament.invites });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER — Get all their pending invites across tournaments
// GET /tournaments/invites/player/:playerId
// ─────────────────────────────────────────────────────────────────────────────
export const getPlayerInvites = async (req, res) => {
  try {
    const { playerId } = req.params;
    const requesterId = req.user?.userId;

    // Players can only see their own invites
    if (playerId !== requesterId?.toString()) {
      return res.status(403).json({ success: false, message: "Cannot view another player's invites" });
    }

    const tournaments = await Tournament.find({
      "invites.playerId": playerId,
      "invites.status": "pending",
    }).select("name city format status startDate ownerId ownerName banner invites");

    // Shape the response to only include this player's invite per tournament
    const invites = tournaments.map((t) => {
      const invite = t.invites.find(
        (i) => i.playerId.toString() === playerId && i.status === "pending"
      );
      return {
        inviteId:       invite._id,
        tournamentId:   t._id,
        tournamentName: t.name,
        city:           t.city,
        format:         t.format,
        status:         t.status,
        startDate:      t.startDate,
        ownerName:      t.ownerName,
        banner:         t.banner,
        message:        invite.message,
        invitedAt:      invite.invitedAt,
      };
    });

    return res.status(200).json({ success: true, count: invites.length, invites });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER — Respond to invite (accept / decline)
// PUT /tournaments/:tournamentId/invites/:inviteId
// Body: { playerId, status: "accepted" | "declined" }
// ─────────────────────────────────────────────────────────────────────────────
export const respondToInvite = async (req, res) => {
  try {
    const { tournamentId, inviteId } = req.params;
    const { playerId, playerName, playerRole, playerPhoto, playerStats, status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be 'accepted' or 'declined'" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    const invite = tournament.invites.id(inviteId);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (invite.playerId.toString() !== playerId) {
      return res.status(403).json({ success: false, message: "This invite is not for you" });
    }
    if (invite.status !== "pending") {
      return res.status(400).json({ success: false, message: `Invite already ${invite.status}` });
    }

    invite.status = status;
    invite.respondedAt = new Date();

    // If accepted → automatically create an approved join request
    if (status === "accepted") {
      if (tournament.squad.some((s) => s.playerId?.toString() === playerId)) {
        return res.status(400).json({ success: false, message: "Already in the squad" });
      }
      if (tournament.squad.length >= tournament.maxSquadSize) {
        return res.status(400).json({ success: false, message: "Squad is full" });
      }

      tournament.joinRequests.push({
        playerId, playerName, playerRole: playerRole || invite.playerRole,
        playerPhoto: playerPhoto || invite.playerPhoto,
        playerStats: playerStats || {},
        status: "approved",
        viaInvite: true,
        requestedAt: new Date(),
        respondedAt: new Date(),
      });

      tournament.squad.push({
        playerId,
        playerName,
        playerRole: playerRole || invite.playerRole || "",
        playerPhoto: playerPhoto || invite.playerPhoto || "",
        playerStats: playerStats || {},
        jerseyNumber: tournament.squad.filter((s) => !s.isSubstitute).length + 1,
      });
    }

    await tournament.save();

    return res.status(200).json({
      success: true,
      message: status === "accepted" ? "You have joined the tournament!" : "Invite declined",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// FEATURE 3: PLAYER RATINGS
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — Rate a squad player after match
// POST /tournaments/:tournamentId/ratings
// Body: { playerId, playerName, stars (1-5), review }
// ─────────────────────────────────────────────────────────────────────────────
export const ratePlayer = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { playerId, playerName, stars, review } = req.body;
    const requesterId = req.user?.id || req.user?._id;
    const raterName   = req.user?.name || req.user?.Fullname || "Owner";

    if (!playerId || !stars) {
      return res.status(400).json({ success: false, message: "playerId and stars are required" });
    }

    const starsNum = Number(stars);
    if (starsNum < 1 || starsNum > 5) {
      return res.status(400).json({ success: false, message: "Stars must be between 1 and 5" });
    }

    const tournament = await Tournament.findById(tournamentId).select("ratings squad ownerId");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    // Only the tournament owner can rate
    if (tournament.ownerId?.toString() !== requesterId?.toString()) {
      return res.status(403).json({ success: false, message: "Only the tournament owner can rate players" });
    }

    // Player must be in the squad
    if (!tournament.squad.some((s) => s.playerId?.toString() === playerId)) {
      return res.status(400).json({ success: false, message: "Player is not in the squad" });
    }

    // Prevent duplicate rating by same owner for same player (update if already exists)
    const existingIdx = tournament.ratings.findIndex(
      (r) => r.playerId.toString() === playerId && r.ratedBy.toString() === requesterId?.toString()
    );

    if (existingIdx >= 0) {
      tournament.ratings[existingIdx].stars  = starsNum;
      tournament.ratings[existingIdx].review = review || "";
    } else {
      tournament.ratings.push({
        playerId,
        playerName,
        ratedBy:   requesterId,
        raterName,
        stars:     starsNum,
        review:    review || "",
      });
    }

    // Mark any rating reminder from this player as seen
    tournament.ratingReminders.forEach((r) => {
      if (r.playerId.toString() === playerId) r.seen = true;
    });

    await tournament.save();
    return res.status(201).json({ success: true, message: "Rating saved successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ratings for a player in a tournament (and their average)
// GET /tournaments/:tournamentId/ratings/:playerId
// ─────────────────────────────────────────────────────────────────────────────
export const getPlayerRatings = async (req, res) => {
  try {
    const { tournamentId, playerId } = req.params;

    const tournament = await Tournament.findById(tournamentId).select("ratings ownerId");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    const playerRatings = tournament.ratings.filter((r) => r.playerId.toString() === playerId);
    const total   = playerRatings.reduce((sum, r) => sum + r.stars, 0);
    const average = playerRatings.length > 0 ? Math.round((total / playerRatings.length) * 10) / 10 : 0;

    return res.status(200).json({
      success: true,
      ratings: playerRatings,
      average,
      count: playerRatings.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET all ratings for all players in a tournament (owner view)
// GET /tournaments/:tournamentId/ratings
// ─────────────────────────────────────────────────────────────────────────────
export const getAllRatings = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const requesterId = req.user?.id || req.user?._id;

    const tournament = await Tournament.findById(tournamentId).select("ratings squad ownerId ratingReminders");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    if (tournament.ownerId?.toString() !== requesterId?.toString()) {
      return res.status(403).json({ success: false, message: "Only the owner can view all ratings" });
    }

    // Build summary per player
    const summaryMap = {};
    for (const r of tournament.ratings) {
      const pid = r.playerId.toString();
      if (!summaryMap[pid]) {
        summaryMap[pid] = { playerId: pid, playerName: r.playerName, totalStars: 0, count: 0, ratings: [] };
      }
      summaryMap[pid].totalStars += r.stars;
      summaryMap[pid].count     += 1;
      summaryMap[pid].ratings.push(r);
    }

    const summary = Object.values(summaryMap).map((s) => ({
      ...s,
      average: Math.round((s.totalStars / s.count) * 10) / 10,
    }));

    // Attach pending reminders
    const pendingReminders = tournament.ratingReminders.filter((r) => !r.seen);

    return res.status(200).json({ success: true, summary, pendingReminders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER — Send a rating reminder to owner
// POST /tournaments/:tournamentId/ratings/remind
// Body: { playerId, playerName }
// ─────────────────────────────────────────────────────────────────────────────
export const sendRatingReminder = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { playerId, playerName } = req.body;

    const tournament = await Tournament.findById(tournamentId).select("squad ratingReminders ownerId");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    // Only squad members can send reminders
    if (!tournament.squad.some((s) => s.playerId?.toString() === playerId)) {
      return res.status(403).json({ success: false, message: "Only squad members can send rating reminders" });
    }

    // Limit to 1 unseen reminder per player
    const alreadySent = tournament.ratingReminders.some(
      (r) => r.playerId.toString() === playerId && !r.seen
    );
    if (alreadySent) {
      return res.status(400).json({ success: false, message: "You already have a pending reminder" });
    }

    tournament.ratingReminders.push({ playerId, playerName });
    await tournament.save();

    return res.status(201).json({ success: true, message: "Reminder sent to tournament owner" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
