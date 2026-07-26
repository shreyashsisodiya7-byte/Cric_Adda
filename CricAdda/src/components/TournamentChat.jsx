  import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_URL, UPLOADS_URL } from "../api";
import {
  Send, X, Trash2, Shield, ShieldOff, MessageSquare, Users
} from "lucide-react";

const photoUrl = (p) =>
  p ? (p.startsWith("http") ? p : `${UPLOADS_URL}/${p}`) : null;

function Avatar({ photo, name, size = "sm" }) {
  const s = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  const url = photoUrl(photo);
  return url ? (
    <img src={url} alt={name}
      className={`${s} rounded-full object-cover border border-white/20 shrink-0`} />
  ) : (
    <div className={`${s} rounded-full bg-[#f4b942]
      flex items-center justify-center text-white font-bold shrink-0 border border-white/20`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function TournamentChat({
  tournamentId, token, userId, userName,
  isOwner, squad = [], onClose,
}) {
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState("");
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [tab, setTab]                 = useState("chat");   // "chat" | "members"
  const [blockedIds, setBlockedIds]   = useState([]);
  const [contextMenu, setContextMenu] = useState(null); // { msgId, x, y, senderId }
  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tournaments/${tournamentId}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []);
    } catch (e) {
      if (e.response?.status !== 403) console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, token]);

  useEffect(() => {
    fetchMessages();
    // Poll every 5 s for new messages
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${API_URL}/tournaments/${tournamentId}/chat`,
        { senderId: userId, senderName: userName, content: text.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, res.data.message]);
      setText("");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (msgId) => {
    try {
      await axios.delete(`${API_URL}/tournaments/${tournamentId}/chat/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) =>
        prev.map((m) => m._id === msgId ? { ...m, isDeleted: true, content: "[Message deleted]" } : m)
      );
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete");
    }
  };

  const blockPlayer = async (playerId) => {
    try {
      await axios.post(
        `${API_URL}/tournaments/${tournamentId}/chat/block`,
        { playerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBlockedIds((prev) => [...prev, playerId]);
      alert("Player blocked from chat.");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to block");
    }
  };

  const unblockPlayer = async (playerId) => {
    try {
      await axios.delete(`${API_URL}/tournaments/${tournamentId}/chat/block/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlockedIds((prev) => prev.filter((id) => id !== playerId));
    } catch (e) {
      alert(e.response?.data?.message || "Failed to unblock");
    }
  };

  const handleRightClick = (e, msg) => {
    e.preventDefault();
    const canDelete = msg.sender._id === userId || isOwner;
    const canBlock  = isOwner && msg.sender._id !== userId;
    if (!canDelete && !canBlock) return;
    setContextMenu({ msgId: msg._id, senderId: msg.sender._id, x: e.clientX, y: e.clientY });
  };

  const isBlocked = (id) => blockedIds.includes(id?.toString());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:w-120 h-[85vh] sm:h-150 bg-[#0f172a] border border-white/10
        rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f4b942]/15 flex items-center justify-center">
              <MessageSquare size={16} className="text-[#f4b942]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Squad Chat</p>
              <p className="text-slate-500 text-xs">{squad.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <button
              onClick={() => setTab(tab === "chat" ? "members" : "chat")}
              className={`p-1.5 rounded-lg transition-colors ${
                tab === "members" ? "bg-blue-600/30 text-[#f4b942]" : "text-slate-400 hover:text-white"
              }`}
            >
              <Users size={16} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MEMBERS TAB */}
        {tab === "members" && (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">
              Squad Members
            </p>
            {squad.map((s) => (
              <div key={s._id}
                className="flex items-center justify-between py-2.5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Avatar photo={s.playerPhoto} name={s.playerName} />
                  <div>
                    <p className="text-white text-sm font-medium">{s.playerName}</p>
                    <p className="text-slate-500 text-xs">{s.playerRole || "Player"}</p>
                  </div>
                </div>
                {isOwner && s.playerId?.toString() !== userId && (
                  isBlocked(s.playerId) ? (
                    <button
                      onClick={() => unblockPlayer(s.playerId)}
                      className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300
                        bg-[#d1fae5] px-2 py-1 rounded-lg"
                    >
                      <ShieldOff size={12} /> Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => blockPlayer(s.playerId)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300
                        bg-red-500/10 px-2 py-1 rounded-lg"
                    >
                      <Shield size={12} /> Block
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {/* CHAT TAB */}
        {tab === "chat" && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#f4b942] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <MessageSquare size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No messages yet. Say hi!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender._id === userId;
                return (
                  <div
                    key={msg._id}
                    className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                    onContextMenu={(e) => handleRightClick(e, msg)}
                  >
                    {!isMe && <Avatar name={msg.sender.name} size="sm" />}
                    <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      {!isMe && (
                        <span className="text-slate-400 text-xs px-1">{msg.sender.name}</span>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm ${
                          msg.isDeleted
                            ? "bg-white/5 text-slate-500 italic"
                            : isMe
                            ? "bg-[#0a1628] text-white rounded-tr-sm"
                            : "bg-white/8 text-slate-200 rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-slate-600 text-xs px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-1.5 border border-white/10 focus-within:border-[#f4b942]/50">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                  className="w-8 h-8 rounded-lg bg-[#f4b942] hover:opacity-90 flex items-center justify-center
                    transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-60 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {(contextMenu.senderId === userId || isOwner) && (
            <button
              onClick={() => { deleteMessage(contextMenu.msgId); setContextMenu(null); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 w-full text-left"
            >
              <Trash2 size={14} /> Delete message
            </button>
          )}
          {isOwner && contextMenu.senderId !== userId && (
            isBlocked(contextMenu.senderId) ? (
              <button
                onClick={() => { unblockPlayer(contextMenu.senderId); setContextMenu(null); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-green-400 hover:bg-white/5 w-full text-left"
              >
                <ShieldOff size={14} /> Unblock player
              </button>
            ) : (
              <button
                onClick={() => { blockPlayer(contextMenu.senderId); setContextMenu(null); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-orange-400 hover:bg-white/5 w-full text-left"
              >
                <Shield size={14} /> Block from chat
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
