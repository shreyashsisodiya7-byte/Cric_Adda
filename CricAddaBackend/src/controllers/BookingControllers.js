import Booking from "../models/BookingModels.js";
import Player from "../models/PlayerModels.js";

// Create a booking request
export const createBookingRequest = async (req, res) => {
  try {
    const {
      ownerId,
      ownerName,
      ownerCity,
      playerId,
      playerName,
      eventName,
      eventDate,
      eventLocation,
      eventType,
      message,
      fee,
      notes,
    } = req.body;

    console.log("Received booking request with data:", {
      ownerId,
      ownerName,
      ownerCity,
      playerId,
      playerName,
      eventName,
      eventDate,
      eventLocation,
      eventType,
    });

    // Validate required fields
    if (!ownerId || !ownerName || !playerId || !playerName || !eventName || !eventDate) {
      const missingFields = [];
      if (!ownerId) missingFields.push("ownerId");
      if (!ownerName) missingFields.push("ownerName");
      if (!playerId) missingFields.push("playerId");
      if (!playerName) missingFields.push("playerName");
      if (!eventName) missingFields.push("eventName");
      if (!eventDate) missingFields.push("eventDate");
      
      console.log("Missing fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Check if player exists
    console.log("Looking for player with ID:", playerId);
    const player = await Player.findById(playerId);
    if (!player) {
      console.log("Player not found with ID:", playerId);
      return res.status(404).json({
        success: false,
        message: `Player not found with ID: ${playerId}. Make sure you're booking a valid player.`,
      });
    }
    console.log("Player found:", player.name);

    // Check if booking already exists (pending or accepted)
    const existingBooking = await Booking.findOne({
      ownerId,
      playerId,
      eventDate: new Date(eventDate),
      status: { $in: ["pending", "accepted"] },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "A booking request already exists for this player",
      });
    }

    // Create new booking
    const booking = new Booking({
      ownerId,
      ownerName,
      ownerCity,
      playerId,
      playerName,
      eventName,
      eventDate,
      eventLocation,
      eventType,
      message,
      fee,
      notes,
    });

    await booking.save();

    return res.status(201).json({
      success: true,
      message: "Booking request sent successfully",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking request:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating booking request",
      error: error.message,
    });
  }
};

// Get all pending requests for a player
export const getPlayerPendingRequests = async (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: "Player ID is required",
      });
    }

    const requests = await Booking.find({
      playerId,
      status: "pending",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching pending requests",
      error: error.message,
    });
  }
};

// Get all booking requests for a player (all statuses)
export const getPlayerAllRequests = async (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: "Player ID is required",
      });
    }

    const requests = await Booking.find({
      playerId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching requests",
      error: error.message,
    });
  }
};

// Accept a booking request
export const acceptBookingRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { playerResponse } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking request not found",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}`,
      });
    }

    booking.status = "accepted";
    booking.playerResponse = playerResponse || "Request accepted";
    booking.respondedAt = new Date();

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking request accepted",
      booking,
    });
  } catch (error) {
    console.error("Error accepting booking request:", error);
    return res.status(500).json({
      success: false,
      message: "Error accepting booking request",
      error: error.message,
    });
  }
};

// Reject a booking request
export const rejectBookingRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { playerResponse } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking request not found",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}`,
      });
    }

    booking.status = "rejected";
    booking.playerResponse = playerResponse || "Request rejected";
    booking.respondedAt = new Date();

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking request rejected",
      booking,
    });
  } catch (error) {
    console.error("Error rejecting booking request:", error);
    return res.status(500).json({
      success: false,
      message: "Error rejecting booking request",
      error: error.message,
    });
  }
};

// Get all bookings sent by an owner
export const getOwnerBookings = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID is required",
      });
    }

    const bookings = await Booking.find({
      ownerId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching owner bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching owner bookings",
      error: error.message,
    });
  }
};

// Get a specific booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching booking",
      error: error.message,
    });
  }
};

// Cancel a booking request (by owner)
export const cancelBookingRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findByIdAndDelete(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking request cancelled",
    });
  } catch (error) {
    console.error("Error cancelling booking request:", error);
    return res.status(500).json({
      success: false,
      message: "Error cancelling booking request",
      error: error.message,
    });
  }
};
