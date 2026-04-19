import Player from '../models/PlayerModels.js'

export const AllPlayersData = async(req,res)=> {
    try {
        const players = await Player.find({})
        res.status(202).json({success: true, data:players});
    } catch (error) {
        console.log("error:",error.message)
        res.status(502).json({success: false ,message:"Error fetching players"});
    }

}
