import app from "./src/app.js"
import connect from "./src/db/db.js"

connect();

app.listen(3000,() => {
    console.log("server is running on port 3000")
})