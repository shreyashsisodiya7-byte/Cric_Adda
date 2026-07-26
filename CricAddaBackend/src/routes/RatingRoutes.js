

  import express from "express";
  import {
    submitRating,
    getPlayerRatings,
    checkRatingExists,
    sendRatingReminder,
    getOwnerReminders,
  } from "../controllers/RatingControllers.js";

  const router = express.Router();

  // Owner submits a 1-5 star rating for a player
  router.post("/", submitRating);

  // Get all public ratings + average for a player
  router.get("/player/:playerId", getPlayerRatings);

  // Check if owner already rated a booking
  router.get("/check/:bookingId/:ownerId", checkRatingExists);

  // Player sends rating reminder to owner
  router.post("/reminder", sendRatingReminder);

  // Owner gets list of pending rating reminders
  router.get("/reminders/:ownerId", getOwnerReminders);

  export default router;