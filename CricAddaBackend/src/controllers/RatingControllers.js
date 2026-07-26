// FILE: src/controllers/RatingControllers.js
// Add to CricAddaBackend/src/controllers/

import Rating from "../models/RatingModel.js";
import RatingReminder from "../models/RatingReminderModel.js";
import Booking from "../models/BookingModels.js";

// ── OWNER: Submit a rating ──────────────────────────────────────────────────────
// POST /ratings
// Body: { bookingId, ownerId, ownerName, playerId, playerName, stars, review }
export const submitRating = async (req, res) => {
  try {
    const { bookingId, ownerId, ownerName, playerId, playerName, stars, review } = req.body;

    if (!bookingId || !ownerId || !playerId || !stars) {
      return res.status(400).json({ success: false, message: "bookingId, ownerId, playerId, and stars are required" });
    }

    const starNum = Number(stars);
    if (isNaN(starNum) || starNum < 1 || starNum > 5) {
      return res.status(400).json({ success: false, message: "Stars must be between 1 and 5" });
    }

    // Verify the booking exists, is accepted, and requester is the owner
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Can only rate after an accepted booking" });
    }
    if (booking.ownerId.toString() !== ownerId.toString()) {
      return res.status(403).json({ success: false, message: "Only the hire owner can rate this player" });
    }
    if (booking.playerId.toString() !== playerId.toString()) {
      return res.status(400).json({ success: false, message: "Player does not match this booking" });
    }

    // Check duplicate
    const existing = await Rating.findOne({ bookingId, ownerId });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already rated this player for this booking" });
    }

    const rating = new Rating({
      playerId,
      playerName,
      ownerId,
      ownerName,
      bookingId,
      stars: starNum,
      review: review || "",
    });
    await rating.save();

    // Mark any pending reminder for this booking as reviewed
    await RatingReminder.findOneAndUpdate(
      { bookingId, ownerId },
      { status: "reviewed" }
    );

    // Compute updated average to return
    const agg = await Rating.aggregate([
      { $match: { playerId: rating.playerId } },
      { $group: { _id: null, avg: { $avg: "$stars" }, count: { $sum: 1 } } },
    ]);
    const avgStars = agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : starNum;
    const totalRatings = agg[0]?.count || 1;

    return res.status(201).json({
      success: true,
      message: "Rating submitted successfully",
      rating,
      averageStars: avgStars,
      totalRatings,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already rated this booking" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET ratings for a player ────────────────────────────────────────────────────
// GET /ratings/player/:playerId
// Returns all public ratings + computed average
export const getPlayerRatings = async (req, res) => {
  try {
    const { playerId } = req.params;

    const ratings = await Rating.find({ playerId, isPublic: true }).sort({ createdAt: -1 });

    const agg = await Rating.aggregate([
      { $match: { playerId: new (await import("mongoose")).default.Types.ObjectId(playerId) } },
      { $group: { _id: null, avg: { $avg: "$stars" }, count: { $sum: 1 } } },
    ]);

    const averageStars = agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : 0;
    const totalRatings = agg[0]?.count || 0;

    return res.status(200).json({
      success: true,
      ratings,
      averageStars,
      totalRatings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── CHECK if owner already rated a booking ──────────────────────────────────────
// GET /ratings/check/:bookingId/:ownerId
export const checkRatingExists = async (req, res) => {
  try {
    const rating = await Rating.findOne({
      bookingId: req.params.bookingId,
      ownerId: req.params.ownerId,
    });
    return res.status(200).json({ success: true, rated: !!rating, rating: rating || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── PLAYER: Send reminder to rate ───────────────────────────────────────────────
// POST /ratings/reminder
// Body: { bookingId, playerId, playerName, ownerId }
export const sendRatingReminder = async (req, res) => {
  try {
    const { bookingId, playerId, playerName, ownerId } = req.body;

    if (!bookingId || !playerId || !ownerId) {
      return res.status(400).json({ success: false, message: "bookingId, playerId, and ownerId are required" });
    }

    // Verify booking is accepted and player is correct
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Can only remind for accepted bookings" });
    }
    if (booking.playerId.toString() !== playerId.toString()) {
      return res.status(403).json({ success: false, message: "You are not the player in this booking" });
    }

    // Check if already rated — no point reminding
    const alreadyRated = await Rating.findOne({ bookingId, ownerId });
    if (alreadyRated) {
      return res.status(400).json({ success: false, message: "The owner has already rated you for this booking" });
    }

    // Upsert: if reminder exists just update timestamp, else create
    const existing = await RatingReminder.findOne({ bookingId, playerId });
    if (existing) {
      if (existing.status === "sent") {
        // Update timestamp to "re-send"
        existing.updatedAt = new Date();
        await existing.save();
        return res.status(200).json({ success: true, message: "Reminder re-sent" });
      }
      return res.status(400).json({ success: false, message: "Owner has already reviewed you" });
    }

    const reminder = new RatingReminder({ bookingId, playerId, playerName, ownerId });
    await reminder.save();

    return res.status(201).json({ success: true, message: "Reminder sent to owner" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You already sent a reminder for this booking" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── OWNER: Get pending reminders ────────────────────────────────────────────────
// GET /ratings/reminders/:ownerId
export const getOwnerReminders = async (req, res) => {
  try {
    const reminders = await RatingReminder.find({
      ownerId: req.params.ownerId,
      status: "sent",
    })
      .populate("bookingId", "eventName eventDate playerName")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, count: reminders.length, reminders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};