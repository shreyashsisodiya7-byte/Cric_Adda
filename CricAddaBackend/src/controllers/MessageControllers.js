import Message from "../models/MessageModels.js";
import Booking from "../models/BookingModels.js";

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

    // Find all bookings where user is either owner or player, with accepted status
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
      
      // Get last message for this booking
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
