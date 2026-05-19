// src/routes/AdminRoutes.js
import express from "express";
import { verifyToken } from "../middlerware/authMiddleware.js";
import { verifyAdmin } from "../middlerware/adminMiddleware.js";
import {
  getAllUsers,
  getAdminStats,
  adminDeleteUser,
  adminSetPlayerStatus,
  adminEditPlayer,
  adminGetAllBookings,
  adminDeleteBooking,
} from "../controllers/AdminController.js";

const router = express.Router();

// All admin routes require token + admin check
router.use(verifyToken, verifyAdmin);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.delete("/users/:userId", adminDeleteUser);
router.patch("/users/:userId/status", adminSetPlayerStatus);
router.patch("/users/:userId/edit", adminEditPlayer);
router.get("/bookings", adminGetAllBookings);
router.delete("/bookings/:bookingId", adminDeleteBooking);

export default router;
