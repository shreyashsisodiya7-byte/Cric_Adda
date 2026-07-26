import Player from "../models/PlayerModels.js";
import userModel from "../models/UserModels.js";
import Booking from "../models/BookingModels.js";
import Message from "../models/MessageModels.js";
import Block from "../models/BlockModel.js";
import Rating from "../models/RatingModel.js";
import RatingReminder from "../models/RatingReminderModel.js";
import Tournament from "../models/TournamentModels.js";

/**
 * Shared cascade logic — call with a userId (string or ObjectId).
 * Cleans every trace of the user from every collection.
 */
export const cascadeDeleteUser = async (userId) => {
  const id = userId.toString();

  // 1. Standalone collections that reference this user directly
  await Promise.all([
    // All bookings where user is owner or player
    Booking.deleteMany({ $or: [{ ownerId: id }, { playerId: id }] }),

    // All messages sent or received
    Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] }),

    // Block records — both sides
    Block.deleteMany({ $or: [{ blockerId: id }, { blockedId: id }] }),

    // Ratings given by or received by this user
    Rating.deleteMany({ $or: [{ playerId: id }, { ownerId: id }] }),

    // Rating reminders sent by or addressed to this user
    RatingReminder.deleteMany({ $or: [{ playerId: id }, { ownerId: id }] }),
  ]);

  // 2. Tournaments owned by this user — delete entire tournament
  await Tournament.deleteMany({ ownerId: id });

  // 3. Inside tournaments owned by others — pull the user out of every
  //    embedded array they could appear in
  await Tournament.updateMany(
    {},
    {
      $pull: {
        squad:        { playerId: id },
        joinRequests: { playerId: id },
        invites:      { playerId: id },
        ratings:      { playerId: id },
        chat:         { senderId: id },
        blockedPlayers: id,
      },
    }
  );

  // 4. Delete the player profile and auth user records
  await Promise.all([
    Player.findByIdAndDelete(id),
    userModel.findByIdAndDelete(id),
  ]);
};

// ── Self-delete (player deletes own account) ──────────────────────────────────
export const deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;

    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ success: false, message: "Player not found" });
    }

    await cascadeDeleteUser(id);

    return res.status(200).json({
      success: true,
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Delete Player Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting player",
      error: error.message,
    });
  }
};