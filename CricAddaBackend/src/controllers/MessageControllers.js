import Message from "../models/MessageModels.js";
import Booking from "../models/BookingModels.js";
import Block from "../models/BlockModel.js";

export const sendMessage = async (req, res) => {
  try {
    const { bookingId, senderId, senderName, receiverId, receiverName, text } = req.body;

    if (!bookingId || !senderId || !receiverId || !text) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: bookingId, senderId, receiverId, text",
      });
    }

    const message = new Message({
      bookingId,
      senderId,
      senderName,
      receiverId,
      receiverName,
      text,
    });

    await message.save();

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

export const getMessagesForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
};

export const getConversationsForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const acceptedBookings = await Booking.find({
      $and: [
        {
          $or: [
            { ownerId: userId },
            { playerId: userId }
          ]
        },
        { status: "accepted" }
      ]
    }).sort({ eventDate: 1 });

    const conversations = [];

    for (const booking of acceptedBookings) {
      const otherUserId = booking.ownerId.toString() === userId.toString() ? booking.playerId : booking.ownerId;
      const otherUserName = booking.ownerId.toString() === userId.toString() ? booking.playerName : booking.ownerName;

      const lastMessage = await Message.findOne({ bookingId: booking._id }).sort({ createdAt: -1 });

      conversations.push({
        bookingId: booking._id,
        otherUserId,
        otherUserName,
        eventName: booking.eventName,
        eventDate: booking.eventDate,
        lastMessage: lastMessage ? lastMessage.text : null,
        lastMessageTime: lastMessage ? lastMessage.createdAt : booking.respondedAt || booking.createdAt,
      });
    }

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching conversations",
      error: error.message,
    });
  }
};

// GET /messages/block/check?blockerId=&blockedId=
export const checkBlock = async (req, res) => {
  try {
    const { blockerId, blockedId } = req.query;
    const [youBlockedThem, theyBlockedYou] = await Promise.all([
      Block.exists({ blockerId, blockedId }),
      Block.exists({ blockerId: blockedId, blockedId: blockerId }),
    ]);
    return res.status(200).json({
      success: true,
      isBlocked: !!(youBlockedThem || theyBlockedYou),
      youBlockedThem: !!youBlockedThem,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /messages/block
export const blockUser = async (req, res) => {
  try {
    const { blockerId, blockedId } = req.body;
    await Block.create({ blockerId, blockedId });
    return res.status(201).json({ success: true, message: "User blocked" });
  } catch (error) {
    if (error.code === 11000)
      return res.status(200).json({ success: true, message: "Already blocked" });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /messages/block/:blockedId?blockerId=
export const unblockUser = async (req, res) => {
  try {
    const { blockedId } = req.params;
    const { blockerId } = req.query;
    await Block.deleteOne({ blockerId, blockedId });
    return res.status(200).json({ success: true, message: "User unblocked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};