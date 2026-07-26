import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Search, Trash2, Shield, ShieldOff, Users } from "lucide-react";
import { API_URL } from "../api";

const MESSAGE_SEEN_KEY = "conversationSeenTimes";

// ── Google Fonts ──────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector(`link[href="${fontLink.href}"]`))
  document.head.appendChild(fontLink);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMe, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2 group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm break-words ${msg.isDeleted
            ? "bg-[#f8fafc] border border-[#e8edf2] text-[#9ca3af] italic"
            : isMe
              ? "bg-[#0a1628] text-white rounded-br-sm"
              : "bg-[#f8fafc] border border-[#e8edf2] text-[#374151] rounded-bl-sm"
            }`}
        >
          {msg.text || msg.content}
        </div>
        <span className="text-xs text-[#9ca3af] mt-0.5 px-1">{fmtTime(msg.createdAt)}</span>

        {isMe && !msg.isDeleted && hovered && onDelete && (
          <button
            onClick={() => onDelete(msg._id)}
            className="absolute -top-2 -left-8 w-6 h-6 rounded-full bg-white border border-[#e8edf2] text-[#9ca3af] hover:text-red-400 flex items-center justify-center transition shadow-sm"
            title="Delete message"
          >
            <Trash2 size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Individual Chat View ──────────────────────────────────────────────────────
function IndividualChat({ conversation, onBack }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [youBlockedThem, setYouBlockedThem] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUserId = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const token = localStorage.getItem("token");

  const scrollBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/messages/booking/${conversation.bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.data || []);
      setTimeout(scrollBottom, 100);
    } catch (_) { }
  }, [conversation.bookingId, token]);

  const checkBlock = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/messages/block/check` , {
        params: { blockerId: currentUserId, blockedId: conversation.otherUserId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsBlocked(res.data.isBlocked);
      setYouBlockedThem(res.data.youBlockedThem);
    } catch (_) { }
  }, [currentUserId, conversation.otherUserId, token]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMessages(), checkBlock()]).finally(() => setLoading(false));
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages, checkBlock]);

  const sendMessage = async () => {
    if (!text.trim() || sending || isBlocked) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${API_URL}/messages/send`,
        {
          bookingId: conversation.bookingId,
          senderId: currentUserId,
          senderName: currentUserName,
          receiverId: conversation.otherUserId,
          receiverName: conversation.otherUserName,
          text: text.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setText("");
        setTimeout(scrollBottom, 50);
      } else {
        alert(res.data.message);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`${API_URL}/chat/message/${messageId}`, {
        data: { requesterId: currentUserId },
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMessages();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete");
    }
  };

  const toggleBlock = async () => {
    const confirmed = window.confirm(
      youBlockedThem
        ? `Unblock ${conversation.otherUserName}?`
        : `Block ${conversation.otherUserName}? They won't be able to message you.`
    );
    if (!confirmed) return;
    try {
      if (youBlockedThem) {
        await axios.delete(`${API_URL}/messages/block/${conversation.otherUserId}`, {
          params: { blockerId: currentUserId },
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `${API_URL}/messages/block`,
          { blockerId: currentUserId, blockedId: conversation.otherUserId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      checkBlock();
    } catch (e) {
      alert(e.response?.data?.message || "Failed");
    }
  };

  const grouped = messages.reduce((acc, msg) => {
    const date = fmtDate(msg.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e8edf2] bg-white shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-[#f8fafc] border border-[#e8edf2] text-[#9ca3af] hover:text-[#0a1628] flex items-center justify-center transition"
        >
          <ArrowLeft size={16} />
        </button>
        {/* Avatar */}
        <button
          type="button"
          onClick={() => navigate(`/PlayerProfile/${conversation.otherUserId}`)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: "linear-gradient(135deg,#0a1628,#1a3a5c)" }}
        >
          {conversation.otherUserName?.[0]?.toUpperCase() || "?"}
        </button>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => navigate(`/PlayerProfile/${conversation.otherUserId}`)}
            className="text-left w-full bg-transparent border-none p-0"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <p className="text-[#0a1628] font-semibold text-sm truncate">
              {conversation.otherUserName}
            </p>
          </button>
          <p className="text-[#9ca3af] text-xs truncate">{conversation.eventName}</p>
        </div>
        <button
          onClick={toggleBlock}
          title={youBlockedThem ? "Unblock user" : "Block user"}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition border ${youBlockedThem
            ? "bg-red-50 border-red-200 text-red-400 hover:bg-red-100"
            : "bg-[#f8fafc] border-[#e8edf2] text-[#9ca3af] hover:text-red-400"
            }`}
        >
          {youBlockedThem ? <ShieldOff size={14} /> : <Shield size={14} />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#f4f7fb]">
        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="w-6 h-6 border-2 border-[#e8edf2] rounded-full animate-spin"
              style={{ borderTopColor: "#f4b942" }}
            />
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex justify-center my-3">
                <span className="text-xs text-[#9ca3af] bg-white border border-[#e8edf2] px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              {msgs.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  msg={msg}
                  isMe={msg.senderId?.toString() === currentUserId}
                  onDelete={deleteMessage}
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Block notice */}
      {isBlocked && (
        <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-500 text-xs text-center">
          {youBlockedThem
            ? `You have blocked ${conversation.otherUserName}. Unblock to send messages.`
            : "You cannot send messages — you have been blocked."}
        </div>
      )}

      {/* Input */}
      {!isBlocked && (
        <div className="p-4 border-t border-[#e8edf2] bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 bg-[#f8fafc] border border-[#e8edf2] rounded-2xl px-4 py-3 text-[#0a1628] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:border-[#f4b942] transition resize-none max-h-32"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="w-11 h-11 shrink-0 rounded-2xl bg-[#0a1628] hover:opacity-90 text-[#f4b942] flex items-center justify-center transition disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Squad Group Chat View ─────────────────────────────────────────────────────
function SquadChat({ tournament, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUserId = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const token = localStorage.getItem("token");

  const isOwner = tournament.ownerId?.toString() === currentUserId;
  const isBlockedFromChat = tournament.chatBlocked?.includes(currentUserId);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tournaments/${tournament._id}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []);
    } catch (_) { }
  }, [tournament._id, token]);

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false));
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${API_URL}/tournaments/${tournament._id}/chat`,
        { senderId: currentUserId, senderName: currentUserName, content: text.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setText("");
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const deleteMsg = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(
        `${API_URL}/chat/squad/${tournament._id}/message/${messageId}`,
        { data: { requesterId: currentUserId }, headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMessages();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete");
    }
  };

  const blockPlayer = async (playerId) => {
    if (!window.confirm("Block this player from group chat?")) return;
    try {
      await axios.put(
        `${API_URL}/chat/squad/${tournament._id}/block/${playerId}`,
        { requesterId: currentUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Player blocked from group chat");
    } catch (e) {
      alert(e.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e8edf2] bg-white shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-[#f8fafc] border border-[#e8edf2] text-[#9ca3af] hover:text-[#0a1628] flex items-center justify-center transition"
        >
          <ArrowLeft size={16} />
        </button>
        {/* Trophy avatar */}
        <div className="w-9 h-9 rounded-full bg-[#fef3c7] border border-[#fde68a] flex items-center justify-center text-lg shrink-0">
          🏆
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#0a1628] font-semibold text-sm truncate">{tournament.name}</p>
          <p className="text-[#9ca3af] text-xs">
            Squad Group Chat · {tournament.squad?.length || 0} members
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#f4f7fb]">
        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="w-6 h-6 border-2 border-[#e8edf2] rounded-full animate-spin"
              style={{ borderTopColor: "#f4b942" }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#9ca3af] py-10">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-sm">No messages yet. Say hi to the squad!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id?.toString() === currentUserId;
            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2 group`}>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {!isMe && (
                    <span className="text-xs text-[#9ca3af] px-1 mb-0.5">{msg.sender?.name}</span>
                  )}
                  <div className="flex items-end gap-2">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm break-words ${msg.content?.startsWith("🚫")
                        ? "bg-[#f8fafc] border border-[#e8edf2] text-[#9ca3af] italic"
                        : isMe
                          ? "bg-[#0a1628] text-white rounded-br-sm"
                          : "bg-white border border-[#e8edf2] text-[#374151] rounded-bl-sm"
                        }`}
                    >
                      {msg.content}
                    </div>
                    {(isMe || isOwner) && !msg.content?.startsWith("🚫") && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
                        <button
                          onClick={() => deleteMsg(msg._id)}
                          className="w-6 h-6 rounded-full bg-white border border-[#e8edf2] text-[#9ca3af] hover:text-red-400 flex items-center justify-center transition shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={10} />
                        </button>
                        {isOwner && !isMe && (
                          <button
                            onClick={() => blockPlayer(msg.sender._id)}
                            className="w-6 h-6 rounded-full bg-white border border-[#e8edf2] text-[#9ca3af] hover:text-[#f4b942] flex items-center justify-center transition shadow-sm"
                            title="Block from chat"
                          >
                            <Shield size={10} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-[#9ca3af] mt-0.5 px-1">{fmtTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {isBlockedFromChat ? (
        <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-500 text-xs text-center">
          You have been blocked from this group chat.
        </div>
      ) : (
        <div className="p-4 border-t border-[#e8edf2] bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Message the squad…"
              rows={1}
              className="flex-1 bg-[#f8fafc] border border-[#e8edf2] rounded-2xl px-4 py-3 text-[#0a1628] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:border-[#f4b942] transition resize-none"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="w-11 h-11 shrink-0 rounded-2xl bg-[#0a1628] hover:opacity-90 text-[#f4b942] flex items-center justify-center transition disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Conversation list item ────────────────────────────────────────────────────
function ConvItem({ conv, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition text-left ${isActive
        ? "bg-[#0a1628] border border-[#0a1628]"
        : "hover:bg-[#f8fafc] border border-transparent"
        }`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
        style={{
          background: isActive
            ? "rgba(244,185,66,0.2)"
            : "linear-gradient(135deg,#e8edf2,#f8fafc)",
          border: isActive ? "1.5px solid rgba(244,185,66,0.4)" : "1.5px solid #e8edf2",
          color: isActive ? "#f4b942" : "#0a1628",
        }}
      >
        {(conv.otherUserName || conv.name)?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-[#0a1628]"}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {conv.otherUserName || conv.name}
          </p>
          {conv.isNewMessage && (
            <span className="w-2.5 h-2.5 bg-[#f4b942] rounded-full shrink-0" />
          )}
        </div>
        <p className={`text-xs truncate mt-0.5 ${isActive ? "text-white/60" : "text-[#9ca3af]"}`}>
          {conv.type === "squad" ? `🏆 ${conv.eventName}` : conv.lastMessage || conv.eventName || "No messages yet"}
        </p>
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [squadTournaments, setSquadTournaments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState("individual");
  const [conversationSeenTimes, setConversationSeenTimes] = useState({});

  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const saveSeenTimes = (st) => {
    localStorage.setItem(MESSAGE_SEEN_KEY, JSON.stringify(st));
    setConversationSeenTimes(st);
  };

  const fetchConversations = useCallback(async (seenTimes = conversationSeenTimes) => {
    try {
      const res = await axios.get(`${API_URL}/messages/conversations/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = (res.data.data || []).map((conv) => {
        const lastTime = conv.lastMessageTime ? new Date(conv.lastMessageTime).getTime() : 0;
        const seenTime = seenTimes[conv.bookingId] || 0;
        return { ...conv, isNewMessage: Boolean(conv.lastMessage && lastTime > seenTime) };
      });
      setConversations(list);
    } catch (_) { }
  }, [currentUserId, token]);

  const fetchSquadTournaments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tournaments/player/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const squads = (res.data.tournaments || []).filter((t) =>
        t.squad?.some((s) => s.playerId?.toString() === currentUserId) ||
        t.ownerId?.toString() === currentUserId
      );
      setSquadTournaments(squads);
    } catch (_) { }
  }, [currentUserId, token]);

  useEffect(() => {
    const stored = localStorage.getItem(MESSAGE_SEEN_KEY);
    const seenTimes = stored ? JSON.parse(stored) : {};
    setConversationSeenTimes(seenTimes);
    setLoading(true);
    Promise.all([fetchConversations(seenTimes), fetchSquadTournaments()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const selectConversation = (conv) => {
    const updated = { ...conversationSeenTimes, [conv.bookingId]: Date.now() };
    saveSeenTimes(updated);
    setConversations((prev) =>
      prev.map((c) => (c.bookingId === conv.bookingId ? { ...c, isNewMessage: false } : c))
    );
    setSelected({ type: "individual", data: conv });
  };

  const filteredConvs = conversations.filter((c) =>
    c.otherUserName?.toLowerCase().includes(search.toLowerCase()) ||
    c.eventName?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSquads = squadTournaments.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = conversations.filter((c) => c.isNewMessage).length;
  const showChat = !!selected;

  const tabCls = (t) =>
    `flex-1 py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 ${mainTab === t
      ? "bg-[#0a1628] text-[#f4b942] shadow-sm"
      : "text-[#9ca3af] hover:text-[#0a1628] hover:bg-[#f8fafc]"
    }`;

  return (
    <div
      className="min-h-screen pt-20 pb-4 px-4 bg-[#f4f7fb]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="max-w-5xl mx-auto h-[calc(100vh-96px)]">
        <div
          className="flex h-full bg-white rounded-3xl overflow-hidden shadow-xl"
          style={{ border: "1.5px solid #e8edf2" }}
        >
          {/* ── Sidebar ── */}
          <div
            className={`${showChat ? "hidden md:flex" : "flex"} w-full md:w-80 flex-col shrink-0`}
            style={{ borderRight: "1.5px solid #e8edf2" }}
          >
            {/* Sidebar header */}
            <div className="p-4" style={{ borderBottom: "1.5px solid #e8edf2" }}>
              <h2
                className="text-xl text-[#0a1628] mb-3"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}
              >
                Messages
              </h2>

              {/* Tab switcher */}
              <div className="flex gap-1 bg-[#f8fafc] rounded-xl p-1 mb-3" style={{ border: "1.5px solid #e8edf2" }}>
                <button className={tabCls("individual")} onClick={() => setMainTab("individual")}>
                  <span>💬 Direct</span>
                  {unreadCount > 0 && (
                    <span className="bg-[#f4b942] text-[#0a1628] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button className={tabCls("squad")} onClick={() => setMainTab("squad")}>
                  <Users size={14} />
                  <span>Squad</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-[#f8fafc] rounded-xl pl-9 pr-4 py-2 text-sm text-[#0a1628] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#f4b942] transition"
                  style={{ border: "1.5px solid #e8edf2", fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-[#e8edf2]" />
                      <div className="flex-1">
                        <div className="h-3 bg-[#e8edf2] rounded-full w-24 mb-2" />
                        <div className="h-2 bg-[#f8fafc] rounded-full w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : mainTab === "individual" ? (
                filteredConvs.length === 0 ? (
                  <div className="text-center py-10 text-[#9ca3af] text-sm">
                    <p className="text-2xl mb-2">💬</p>
                    <p>No conversations yet</p>
                    <p className="text-xs mt-1">Accept a booking to start chatting</p>
                  </div>
                ) : (
                  filteredConvs.map((conv) => (
                    <ConvItem
                      key={conv.bookingId}
                      conv={conv}
                      isActive={selected?.type === "individual" && selected.data.bookingId === conv.bookingId}
                      onClick={() => selectConversation(conv)}
                    />
                  ))
                )
              ) : (
                filteredSquads.length === 0 ? (
                  <div className="text-center py-10 text-[#9ca3af] text-sm">
                    <p className="text-2xl mb-2">🏆</p>
                    <p>No squad chats yet</p>
                    <p className="text-xs mt-1">Join a tournament to access squad chat</p>
                  </div>
                ) : (
                  filteredSquads.map((t) => (
                    <ConvItem
                      key={t._id}
                      conv={{ name: t.name, eventName: t.format, type: "squad" }}
                      isActive={selected?.type === "squad" && selected.data._id === t._id}
                      onClick={() => setSelected({ type: "squad", data: t })}
                    />
                  ))
                )
              )}
            </div>
          </div>

          {/* ── Chat area ── */}
          <div className={`${showChat ? "flex" : "hidden md:flex"} flex-1 flex-col bg-[#f4f7fb]`}>
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-[#9ca3af]">
                <div className="text-center">
                  <p className="text-5xl mb-3">💬</p>
                  <p
                    className="text-xl text-[#0a1628] mb-1"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}
                  >
                    Select a Conversation
                  </p>
                  <p className="text-sm">Choose from the sidebar to start chatting</p>
                </div>
              </div>
            ) : selected.type === "individual" ? (
              <IndividualChat conversation={selected.data} onBack={() => setSelected(null)} />
            ) : (
              <SquadChat tournament={selected.data} onBack={() => setSelected(null)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}