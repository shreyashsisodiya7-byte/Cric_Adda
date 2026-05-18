import Player from '../models/PlayerModels.js'
import User from '../models/UserModels.js'


export const getPlayerProfile = async (req, res) => {
  try {

    let playerData = await Player.findById(req.params.userId);

    // If no player doc exists, create one automatically ✅
    if (!playerData) {

      // Get the user's name from Users collection
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Create a fresh Player document
      playerData = await Player.create({
        _id: req.params.userId,
        name: user.Fullname,
        photo: "",
        userType: 'Player',
        role: '🏏 Batsman',
        city: '',
        fee: 0,
        note: '',
        about: '',
        status: 'Available',
        stats: { matches: 0, runs: 0, wickets: 0 },
        availability: Array(10).fill(false),
      });

      console.log(`Auto-created player profile for: ${user.Fullname}`);
    }

    res.status(200).json({ success: true, data: playerData });

  } catch (error) {
    console.log("EXACT ERROR:", error.message);
    res.status(500).json({ success: false, message: "Error loading profile" });
  }
};
