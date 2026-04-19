import express from "express"
import UserRoutes from "./routes/UserRoutes.js"
import cors from "cors"
import PlayerRoutes from "./routes/PlayerRoutes.js"

const app = express()

app.use(cors())
app.use(express.json());


app.use("/user",UserRoutes)
app.use("/players",PlayerRoutes)
app.use("/uploads",express.static("uploads"))

export default app
