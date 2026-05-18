import dotenv from "dotenv"
import app from "./src/app.js"
import connect from "./src/db/db.js"

dotenv.config();

connect();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`)
})