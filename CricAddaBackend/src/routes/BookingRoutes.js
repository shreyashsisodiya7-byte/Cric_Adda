import express from "express";
import {
  createBookingRequest,
  getPlayerPendingRequests,
  getPlayerAllRequests,
  acceptBookingRequest,
  rejectBookingRequest,
  getOwnerBookings,
  getBookingById,
  cancelBookingRequest,
} from "../controllers/BookingControllers.js";
import {
  submitMatchStats,
  getMatchStats,
  getPendingStatsObligation,
} from "../controllers/MatchStatsController.js";

const router = express.Router();

// Create a new booking request
router.post("/request", createBookingRequest);

// Get pending requests for a player
router.get("/player/:playerId/pending", getPlayerPendingRequests);

// Get all requests for a player
router.get("/player/:playerId/all", getPlayerAllRequests);

// Get all bookings sent by an owner
router.get("/owner/:ownerId", getOwnerBookings);

// Check owner's pending stats obligations (before allowing new booking)
router.get("/owner/:ownerId/pending-stats", getPendingStatsObligation);

// Get a specific booking by ID
router.get("/:bookingId", getBookingById);

// Accept a booking request
router.put("/:bookingId/accept", acceptBookingRequest);

// Reject a booking request
router.put("/:bookingId/reject", rejectBookingRequest);

// Cancel a booking request (by owner)
router.delete("/:bookingId", cancelBookingRequest);

// Post-match stats submission (owner → player profile)
router.post("/:bookingId/match-stats", submitMatchStats);
router.get("/:bookingId/match-stats", getMatchStats);

export default router;