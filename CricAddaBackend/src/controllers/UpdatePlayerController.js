import mongoose from 'mongoose';
import Player from '../models/PlayerModels.js';

export const updateProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId provided",
      });
    }

    const updateData = {};

    // Name — check uniqueness before allowing the update
    if (req.body.name) {
      const newName = req.body.name.trim();

      const nameExists = await Player.findOne({
        name: { $regex: `^${newName}$`, $options: "i" },
        _id: { $ne: req.params.userId }, // exclude the current user
      });

      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: "This name is already taken. Please choose a different name.",
        });
      }

      updateData.name = newName;
    }

    if (req.body.userType) updateData.userType = req.body.userType;
    if (req.body.role)     updateData.role     = req.body.role;
    if (req.body.city)     updateData.city     = req.body.city;
    if (req.body.note)     updateData.note     = req.body.note;
    if (req.body.about)    updateData.about    = req.body.about;

    if (req.body.fee !== undefined) {
      const feeNumber = Number(req.body.fee);
      if (!Number.isNaN(feeNumber)) updateData.fee = feeNumber;
    }

    if (req.body.stats) {
      try {
        const stats = JSON.parse(req.body.stats);
        updateData.stats = {
          matches:      Number(stats.matches)      || 0,
          runs:         Number(stats.runs)         || 0,
          ballsFaced:   Number(stats.ballsFaced)   || 0,
          wickets:      Number(stats.wickets)      || 0,
          oversBowled:  Number(stats.oversBowled)  || 0,
          runsConceded: Number(stats.runsConceded) || 0,
        };
      } catch {
        // ignore invalid JSON
      }
    }

    if (req.body.availability) {
      try {
        const availability = JSON.parse(req.body.availability);
        if (Array.isArray(availability)) {
          updateData.availability = availability.map((v) => Boolean(v));
        }
      } catch {
        // ignore invalid JSON
      }
    }

    if (req.file && typeof req.file.filename === 'string') {
      updateData.photo = req.file.filename;
    }

    const updatePlayer = await Player.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatePlayer,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Profile Update failed",
      error: err.message,
    });
  }
};