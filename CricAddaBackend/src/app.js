import express from "express"
import UserRoutes from "./routes/UserRoutes.js"
import cors from "cors"
import PlayerRoutes from "./routes/PlayerRoutes.js"
import BookingRoutes from "./routes/BookingRoutes.js"
import MessageRoutes from "./routes/MessageRoutes.js"
import { verifyToken } from "./middlerware/authMiddleware.js"
import AdminRoutes from "./routes/AdminRoutes.js"   
import TournamentRoutes from "./routes/TournamentRoutes.js";
import RatingRoutes from "./routes/RatingRoutes.js";


const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use("/user",UserRoutes)
app.use("/players",PlayerRoutes)
app.use("/bookings",verifyToken,BookingRoutes)
app.use("/messages",verifyToken,MessageRoutes)
app.use("/uploads",express.static("uploads"))
app.use("/admin",verifyToken, AdminRoutes)
app.use("/tournaments", TournamentRoutes);
app.use("/ratings", verifyToken, RatingRoutes);

export default app