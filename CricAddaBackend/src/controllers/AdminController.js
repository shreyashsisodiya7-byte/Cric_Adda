import userModel from "../models/UserModels.js";
import Player from "../models/PlayerModels.js";
import Booking from "../models/BookingModels.js";

// GET all users with their player profiles
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, { Password: 0 });
    const players = await Player.find({});

    const merged = users.map((user) => {
      const player = players.find((p) => p._id.toString() === user._id.toString());
      return {
        _id: user._id,
        Fullname: user.Fullname,
        Email: user.Email,
        role: player?.role || "N/A",
        city: player?.city || "N/A",
        status: player?.status || "N/A",
        userType: player?.userType || "Player",
        fee: player?.fee || 0,
        stats: player?.stats || {},
        photo: player?.photo || "",
        archived: player?.archived || false,
        createdAt: user.createdAt,
      };
    });

    return res.status(200).json({ success: true, data: merged });
  } catch (err) {
    console.log("Admin getAllUsers error:", err);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

// GET dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments();
    const totalPlayers = await Player.countDocuments();
    const availablePlayers = await Player.countDocuments({ status: "Available" });
    const archivedPlayers = await Player.countDocuments({ archived: true });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const acceptedBookings = await Booking.countDocuments({ status: "accepted" });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalPlayers,
        availablePlayers,
        archivedPlayers,
        totalBookings,
        pendingBookings,
        acceptedBookings,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching stats" });
  }
};

// DELETE a user and their player profile
export const adminDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await userModel.findByIdAndDelete(userId);
    await Player.findByIdAndDelete(userId);
    await Booking.deleteMany({ $or: [{ ownerId: userId }, { playerId: userId }] });
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.log("Admin delete error:", err);
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};

// PATCH — set player status (Available / Not Available / Archived)
export const adminSetPlayerStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, archived } = req.body;

    const update = {};
    if (status !== undefined) update.status = status;
    if (archived !== undefined) update.archived = archived;

    const player = await Player.findByIdAndUpdate(userId, update, { returnDocument: "after" });
    if (!player) return res.status(404).json({ success: false, message: "Player not found" });

    return res.status(200).json({ success: true, message: "Player updated", data: player });
  } catch (err) {
    console.log("Admin status error:", err);
    res.status(500).json({ success: false, message: "Error updating player status" });
  }
};

// PATCH — edit any field on a player profile
export const adminEditPlayer = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const player = await Player.findByIdAndUpdate(userId, updates, { returnDocument: "after" });
    if (!player) return res.status(404).json({ success: false, message: "Player not found" });

    return res.status(200).json({ success: true, message: "Player updated", data: player });
  } catch (err) {
    console.log("Admin edit error:", err);
    res.status(500).json({ success: false, message: "Error editing player" });
  }
};

// GET all bookings
export const adminGetAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching bookings" });
  }
};

// DELETE a booking
export const adminDeleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    await Booking.findByIdAndDelete(bookingId);
    return res.status(200).json({ success: true, message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting booking" });
  }
};
