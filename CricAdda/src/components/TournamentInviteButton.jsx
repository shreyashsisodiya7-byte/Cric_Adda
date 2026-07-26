// src/components/TournamentInviteButton.jsx
// Drop this anywhere you show a player card (FindPlayers, PlayerProfile, etc.)
// Props:
//   player  — { _id, name, role, photo }
//   token   — JWT from localStorage
//   userId  — logged-in user's _id
//
// Usage:
//   <TournamentInviteButton player={player} token={token} userId={currentUserId} />

import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../api";
import { Send, ChevronDown, CheckCircle, X } from "lucide-react";

export default function TournamentInviteButton({ player, token, userId }) {
  const [open, setOpen]           = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState("");
  const [sending, setSending]     = useState(false);
  const [success, setSuccess]     = useState("");
  const [error, setError]         = useState("");

  // Fetch owner's tournaments when dropdown opens
  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    axios
      .get(`${API_URL}/tournaments/owner/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Only show upcoming/ongoing tournaments
        const active = (res.data.tournaments || []).filter(
          (t) => t.status === "upcoming" || t.status === "ongoing"
        );
        setTournaments(active);
      })
      .catch(() => setError("Failed to load your tournaments"))
      .finally(() => setLoading(false));
  }, [open, userId, token]);

  const handleInvite = async (tournament) => {
    setSending(true);
    setError("");
    setSuccess("");
    try {
      await axios.post(
        `${API_URL}/tournaments/${tournament._id}/invites`,
        {
          playerId:    player._id,
          playerName:  player.name,
          playerRole:  player.role || "",
          playerPhoto: player.photo || "",
          message,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Invite sent to ${player.name} for "${tournament.name}"!`);
      setOpen(false);
      setMessage("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  if (!token || !userId) return null;

  return (
    <div className="relative  sm:w-auto">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen((v) => !v); setError(""); setSuccess(""); }}
        className="w-full flex items-center justify-center mx-3.5 gap-1.5 px-3 py-2 rounded-lg bg-[#f4b942] hover:opacity-90 text-[#0a1628] text-xs font-semibold transition-all"
      >
        🎯 Invite to Tournament squad
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Success toast */}
      {success && (
        <div className="absolute left-0 top-12 z-50 flex items-center gap-2 bg-[#059669]/95 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          <CheckCircle size={14} /> {success}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-12 z-50 w-full sm:w-80 bg-white border border-[#e8edf2] rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8edf2] bg-[#f8fafc]">
            <p className="text-[#0a1628] text-sm font-semibold">Select Tournament</p>
            <button onClick={() => setOpen(false)} className="text-[#9ca3af] hover:text-[#0a1628]">
              <X size={16} />
            </button>
          </div>

          {/* Optional message */}
          <div className="px-4 py-2 border-b border-[#e8edf2]">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message (optional)..."
              className="w-full bg-[#f8fafc] text-[#0a1628] text-xs rounded-lg px-3 py-1.5 placeholder:text-[#9ca3af] outline-none border border-[#e8edf2] focus:border-[#f4b942] transition-colors"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading && (
              <p className="text-[#9ca3af] text-xs text-center py-4">Loading tournaments...</p>
            )}
            {!loading && tournaments.length === 0 && (
              <p className="text-[#9ca3af] text-xs text-center py-4">
                No active tournaments found.
                <br />Create one first!
              </p>
            )}
            {!loading && tournaments.map((t) => (
              <button
                key={t._id}
                onClick={() => handleInvite(t)}
                disabled={sending}
                className="w-full flex flex-col px-4 py-3 hover:bg-[#f8fafc] border-b border-[#e8edf2] text-left transition-colors disabled:opacity-50"
              >
                <span className="text-[#0a1628] text-sm font-semibold">{t.name}</span>
                <span className="text-[#607080] text-xs mt-0.5">
                  {t.city} · {t.format} · {new Date(t.startDate).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-600 text-xs text-center px-4 py-2 bg-red-50 border-t border-red-200">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
