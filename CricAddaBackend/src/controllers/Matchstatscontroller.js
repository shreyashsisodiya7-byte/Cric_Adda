import Booking from "../models/BookingModels.js";
import Player  from "../models/PlayerModels.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const dayStart = (d) => new Date(new Date(d).setHours(0, 0, 0, 0));

/**
 * Returns all accepted bookings for an owner where:
 *   - eventDate has passed (match day is over)
 *   - statsSubmitted === false
 *
 * These are the bookings the owner is OBLIGATED to fill before booking again.
 */
export const getPendingStatsObligation = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const pending = await Booking.find({
      ownerId,
      status: "accepted",
      statsSubmitted: false,
      eventDate: { $lt: dayStart(new Date()) }, // event date already passed
    }).sort({ eventDate: -1 });

    return res.status(200).json({
      success: true,
      count: pending.length,
      hasPending: pending.length > 0,
      bookings: pending,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /bookings/:bookingId/match-stats
// Owner submits match stats for a player after the event.
// Body: { runs, ballsFaced, wickets, oversBowled, runsConceded, catches, playerRating, notes }
// ─────────────────────────────────────────────────────────────────────────────
export const submitMatchStats = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      runs = 0,
      ballsFaced = 0,
      wickets = 0,
      oversBowled = 0,
      runsConceded = 0,
      catches = 0,
      playerRating,
      notes = "",
    } = req.body;

    // ── Validate booking ──────────────────────────────────────────────────────
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Stats can only be submitted for accepted bookings" });
    }
    if (booking.statsSubmitted) {
      return res.status(400).json({ success: false, message: "Stats already submitted for this booking" });
    }

    // Event must have passed
    if (new Date(booking.eventDate) >= dayStart(new Date())) {
      return res.status(400).json({ success: false, message: "Stats can only be submitted after the event date has passed" });
    }

    // Validate playerRating
    if (playerRating !== undefined && playerRating !== null) {
      const r = Number(playerRating);
      if (isNaN(r) || r < 1 || r > 5) {
        return res.status(400).json({ success: false, message: "playerRating must be between 1 and 5" });
      }
    }

    // ── Save stats on booking ─────────────────────────────────────────────────
    booking.statsSubmitted = true;
    booking.statsSubmittedAt = new Date();
    booking.matchStats = {
      runs:         Number(runs)         || 0,
      ballsFaced:   Number(ballsFaced)   || 0,
      wickets:      Number(wickets)      || 0,
      oversBowled:  Number(oversBowled)  || 0,
      runsConceded: Number(runsConceded) || 0,
      catches:      Number(catches)      || 0,
      playerRating: playerRating != null ? Number(playerRating) : null,
      notes,
    };
    await booking.save();

    // ── Merge stats into the player's profile ─────────────────────────────────
    const player = await Player.findById(booking.playerId);
    if (player) {
      const cur = player.stats || {};
      await Player.findByIdAndUpdate(booking.playerId, {
        $set: {
          "stats.matches":      (cur.matches      || 0) + 1,
          "stats.runs":         (cur.runs         || 0) + (Number(runs)         || 0),
          "stats.ballsFaced":   (cur.ballsFaced   || 0) + (Number(ballsFaced)   || 0),
          "stats.wickets":      (cur.wickets      || 0) + (Number(wickets)      || 0),
          "stats.oversBowled":  (cur.oversBowled  || 0) + (Number(oversBowled)  || 0),
          "stats.runsConceded": (cur.runsConceded || 0) + (Number(runsConceded) || 0),
          "stats.catches":      (cur.catches      || 0) + (Number(catches)      || 0),
        },
      });
    }

    // ── Increment owner's trust score ─────────────────────────────────────────
    await Player.findByIdAndUpdate(booking.ownerId, {
      $inc: { trustScore: 10 },
    });

    return res.status(200).json({
      success: true,
      message: "Match stats submitted successfully! Player profile updated and your trust score increased.",
      booking,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /bookings/:bookingId/match-stats
// Returns the submitted stats for a booking (visible to both owner and player)
// ─────────────────────────────────────────────────────────────────────────────
export const getMatchStats = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    return res.status(200).json({
      success: true,
      statsSubmitted: booking.statsSubmitted,
      matchStats: booking.statsSubmitted ? booking.matchStats : null,
      statsSubmittedAt: booking.statsSubmittedAt || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};