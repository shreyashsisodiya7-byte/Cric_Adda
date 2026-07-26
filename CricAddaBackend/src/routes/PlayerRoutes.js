    import express from "express"
    import { updateProfile } from "../controllers/UpdatePlayerController.js";
    import { getPlayerProfile } from "../controllers/GetPlayerController.js";
    import {AllPlayersData} from "../controllers/GetAllPlayersController.js";
    import upload from "../middlerware/upload.js";
    import { deletePlayer } from "../controllers/DeleteController.js";

    const router = express.Router()

    router.get("/all",AllPlayersData)
    router.put("/update/:userId", upload.single("photo"), updateProfile);
    router.get("/profile/:userId",getPlayerProfile)
    router.delete("/delete/:id", deletePlayer);

    export default router;