import Player from '../models/PlayerModels.js'

export const AllPlayersData = async(req,res)=> {
    try {
        const players = await Player.find({})
        res.status(200).json({success: true, data:players});
    } catch (error) {
        console.log("error:",error.message)
        res.status(500).json({success: false ,message:"Error fetching players"});
    }

}
