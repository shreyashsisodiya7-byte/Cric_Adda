import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Send, ArrowLeft, Search } from "lucide-react";
import { API_URL } from "../api";

const MESSAGE_SEEN_KEY = "conversationSeenTimes";

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [conversationSeenTimes, setConversationSeenTimes] = useState({});
  const messagesEndRef = useRef(null);

  const currentUserId = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const token = localStorage.getItem("token");

  const saveConversationSeenTimes = (seenTimes) => {
    localStorage.setItem(MESSAGE_SEEN_KEY, JSON.stringify(seenTimes));
    setConversationSeenTimes(seenTimes);
  };

  const markConversationAsSeen = (bookingId, lastMessageTime) => {
    const timestamp = lastMessageTime
      ? new Date(lastMessageTime).getTime()
      : Date.now();

    const updated = {
      ...conversationSeenTimes,
      [bookingId]: timestamp,
    };

    saveConversationSeenTimes(updated);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.bookingId === bookingId ? { ...conv, isNewMessage: false } : conv
      )
    );
  };

  // Fetch conversations
  useEffect(() => {
    const stored = localStorage.getItem(MESSAGE_SEEN_KEY);
    const seenTimes = stored ? JSON.parse(stored) : {};
    setConversationSeenTimes(seenTimes);
    fetchConversations(seenTimes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConversations = async (seenTimes = conversationSeenTimes) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/messages/conversations/${currentUserId}`, {
  headers: { Authorization: `Bearer ${token}` }
}
      );
      const conversationsWithFlags = (res.data.data || []).map((conv) => {
        const lastTime = conv.lastMessageTime
          ? new Date(conv.lastMessageTime).getTime()
          : 0;
        const seenTime = seenTimes[conv.bookingId] || 0;
        return {
          ...conv,
          isNewMessage: Boolean(conv.lastMessage && lastTime > seenTime),
        };
      });

      setConversations(conversationsWithFlags);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 8000); // Poll for new messages
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/messages/booking/${selectedConversation.bookingId}`,
         {
  headers: { Authorization: `Bearer ${token}` }
}
      );
      setMessages(res.data.data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await axios.post(`${API_URL}/messages/send`, {
        bookingId: selectedConversation.bookingId,
        senderId: currentUserId,
        senderName: currentUserName,
        receiverId: selectedConversation.otherUserId,
        receiverName: selectedConversation.otherUserName,
        text: messageText,
      }, {
  headers: { Authorization: `Bearer ${token}` }
});

      setMessageText("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUserName.toLowerCase().includes(search.toLowerCase()) ||
    conv.eventName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center text-white text-xl pt-20">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden pt-20">
      {/* Sidebar */}
      <div
        className={`${
          selectedConversation ? "hidden md:flex" : "flex"
        } w-full md:w-80 flex-col border-r border-gray-700 bg-gray-800`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold mb-4">Messages</h2>

          {/* Search */}
          <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="bg-transparent outline-none px-2 flex-1 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <div
                key={conv.bookingId}
                onClick={() => {
                  setSelectedConversation(conv);
                  markConversationAsSeen(conv.bookingId, conv.lastMessageTime);
                }}
                className={`p-4 border-b border-gray-700 cursor-pointer transition ${
                  selectedConversation?.bookingId === conv.bookingId
                    ? "bg-blue-600"
                    : "hover:bg-gray-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{conv.otherUserName}</h3>
                    {conv.isNewMessage && (
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTime(conv.lastMessageTime)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{conv.eventName}</p>
                <p className="text-xs text-gray-500">
                  📅 {formatDate(conv.eventDate)}
                </p>
                {conv.lastMessage && (
                  <p className="text-sm text-gray-300 truncate mt-1">
                    {conv.lastMessage}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400">
              No accepted bookings yet
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`${
          selectedConversation ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-gray-900`}
      >
        {selectedConversation ? (
          <>
            {/* Top Bar */}
            <div className="h-16 border-b border-gray-700 flex items-center justify-between px-4 md:px-6 bg-gray-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h2 className="font-semibold">{selectedConversation.otherUserName}</h2>
                  <p className="text-xs text-gray-400">
                    {selectedConversation.eventName} • {formatDate(selectedConversation.eventDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${
                    msg.senderId === currentUserId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderId === currentUserId
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <span className="text-xs opacity-70 block mt-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;