
import Invite from "../models/InviteModel.js";
import Tournament from "../models/TournamentModels.js";
import Player from "../models/PlayerModels.js";

// ── OWNER: Send invite to a player ─────────────────────────────────────────────
// POST /invites/send
// Body: { tournamentId, ownerId, ownerName, playerId, playerName, message }
export const sendInvite = async (req, res) => {
  try {
    const { tournamentId, ownerId, ownerName, playerId, playerName, message } = req.body;

    if (!tournamentId || !ownerId || !playerId || !playerName) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Confirm requester is the tournament owner
    const tournament = await Tournament.findById(tournamentId).select("ownerId name squad joinRequests status");
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });
    if (tournament.ownerId.toString() !== ownerId.toString()) {
      return res.status(403).json({ success: false, message: "Only the tournament owner can send invites" });
    }
    if (["completed", "cancelled"].includes(tournament.status)) {
      return res.status(400).json({ success: false, message: "Tournament is not accepting players" });
    }
    if (tournament.squad.length >= tournament.maxSquadSize) {
      return res.status(400).json({ success: false, message: "Squad is already full" });
    }

    // Check player already in squad
    if (tournament.squad.some((s) => s.playerId?.toString() === playerId.toString())) {
      return res.status(400).json({ success: false, message: "Player is already in the squad" });
    }

    // Create or check duplicate invite
    const existing = await Invite.findOne({ tournamentId, playerId });
    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ success: false, message: "Invite already sent and pending" });
      }
      if (existing.status === "accepted") {
        return res.status(400).json({ success: false, message: "Player already accepted a previous invite" });
      }
      // Declined — allow resend by updating
      existing.status = "pending";
      existing.message = message || "";
      existing.respondedAt = undefined;
      await existing.save();
      return res.status(200).json({ success: true, message: "Invite re-sent", invite: existing });
    }

    const invite = new Invite({
      tournamentId,
      tournamentName: tournament.name,
      ownerId,
      ownerName,
      playerId,
      playerName,
      message: message || "",
    });
    await invite.save();

    return res.status(201).json({ success: true, message: "Invite sent successfully", invite });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Invite already exists for this player" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── PLAYER: Get all pending invites ─────────────────────────────────────────────
// GET /invites/player/:playerId
export const getPlayerInvites = async (req, res) => {
  try {
    const invites = await Invite.find({ playerId: req.params.playerId, status: "pending" })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: invites.length, invites });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── PLAYER: Get ALL invites (any status) ────────────────────────────────────────
// GET /invites/player/:playerId/all
export const getAllPlayerInvites = async (req, res) => {
  try {
    const invites = await Invite.find({ playerId: req.params.playerId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: invites.length, invites });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── OWNER: Get all invites sent for a tournament ────────────────────────────────
// GET /invites/tournament/:tournamentId
export const getTournamentInvites = async (req, res) => {
  try {
    const invites = await Invite.find({ tournamentId: req.params.tournamentId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: invites.length, invites });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── PLAYER: Accept invite ───────────────────────────────────────────────────────
// PUT /invites/:inviteId/accept
export const acceptInvite = async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.inviteId);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (invite.status !== "pending") {
      return res.status(400).json({ success: false, message: `Invite already ${invite.status}` });
    }

    // Add player to tournament squad (same flow as approveJoinRequest)
    const tournament = await Tournament.findById(invite.tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    if (tournament.squad.length >= tournament.maxSquadSize) {
      return res.status(400).json({ success: false, message: "Squad is now full" });
    }
    if (tournament.squad.some((s) => s.playerId?.toString() === invite.playerId.toString())) {
      // Already in squad (maybe from join request), just mark invite accepted
      invite.status = "accepted";
      invite.respondedAt = new Date();
      await invite.save();
      return res.status(200).json({ success: true, message: "Invite accepted — you are already in the squad" });
    }

    // Get player profile for full info
    let playerRole = "", playerPhoto = "", playerStats = {};
    try {
      const player = await Player.findById(invite.playerId).select("role photo stats");
      if (player) {
        playerRole = player.role || "";
        playerPhoto = player.photo || "";
        playerStats = player.stats || {};
      }
    } catch (_) {}

    tournament.squad.push({
      playerId: invite.playerId,
      playerName: invite.playerName,
      playerRole,
      playerPhoto,
      playerStats,
      jerseyNumber: tournament.squad.filter((s) => !s.isSubstitute).length + 1,
      isSubstitute: false,
    });

    // Also add as accepted join request record for consistency
    const existingRequest = tournament.joinRequests.find(
      (r) => r.playerId.toString() === invite.playerId.toString()
    );
    if (!existingRequest) {
      tournament.joinRequests.push({
        playerId: invite.playerId,
        playerName: invite.playerName,
        playerRole,
        playerPhoto,
        playerStats,
        message: "(Accepted invite)",
        status: "approved",
        respondedAt: new Date(),
      });
    } else if (existingRequest.status === "pending") {
      existingRequest.status = "approved";
      existingRequest.respondedAt = new Date();
    }

    await tournament.save();

    invite.status = "accepted";
    invite.respondedAt = new Date();
    await invite.save();

    return res.status(200).json({ success: true, message: "Invite accepted — you have joined the tournament!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── PLAYER: Decline invite ──────────────────────────────────────────────────────
// PUT /invites/:inviteId/decline
export const declineInvite = async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.inviteId);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (invite.status !== "pending") {
      return res.status(400).json({ success: false, message: `Invite already ${invite.status}` });
    }

    invite.status = "declined";
    invite.respondedAt = new Date();
    await invite.save();

    return res.status(200).json({ success: true, message: "Invite declined" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── OWNER: Cancel / revoke an invite ───────────────────────────────────────────
// DELETE /invites/:inviteId
export const cancelInvite = async (req, res) => {
  try {
    const invite = await Invite.findByIdAndDelete(req.params.inviteId);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    return res.status(200).json({ success: true, message: "Invite cancelled" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};