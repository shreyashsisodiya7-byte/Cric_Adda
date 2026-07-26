// src/components/PlayerRatingModal.jsx
// Two modes:
//  1. isOwner=true  → owner can give/update star rating + review
//  2. isOwner=false → player sees their ratings and can send a reminder
//
// Usage:
//   <PlayerRatingModal
//     tournamentId={t._id}
//     player={{ _id, name, photo, role }}
//     isOwner={true}
//     token={token}
//     userId={currentUserId}
//     userName={currentUserName}
//     onClose={() => setRatingOpen(false)}
//   />

import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, UPLOADS_URL } from "../api";
import { X, Star, Bell, CheckCircle, Send } from "lucide-react";

const photoUrl = (p) =>
  p ? (p.startsWith("http") ? p : `${UPLOADS_URL}/${p}`) : null;

// ── Star Rating Input ─────────────────────────────────────────────────────────
function StarInput({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 disabled:cursor-default"
        >
          <Star
            size={32}
            className={`transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Star Display (read-only average) ─────────────────────────────────────────
function StarDisplay({ value, size = 18 }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const half   = !filled && value >= star - 0.5;
        return (
          <Star
            key={star}
            size={size}
            className={
              filled ? "fill-yellow-400 text-yellow-400" :
              half   ? "fill-yellow-400/50 text-yellow-400" :
              "text-slate-600"
            }
          />
        );
      })}
    </div>
  );
}

export default function PlayerRatingModal({
  tournamentId, player, isOwner, token, userId, userName, onClose, onSaved,
}) {
  const [stars, setStars]       = useState(0);
  const [review, setReview]     = useState("");
  const [existing, setExisting] = useState(null); // existing rating by this owner
  const [allRatings, setAllRatings] = useState([]);
  const [average, setAverage]   = useState(0);
  const [count, setCount]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [reminding, setReminding] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [msg, setMsg]           = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/tournaments/${tournamentId}/ratings/${player._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAllRatings(res.data.ratings || []);
        setAverage(res.data.average || 0);
        setCount(res.data.count || 0);

        // If owner, pre-fill with their existing rating
        if (isOwner) {
          const mine = (res.data.ratings || []).find(
            (r) => r.ratedBy?.toString() === userId
          );
          if (mine) {
            setExisting(mine);
            setStars(mine.stars);
            setReview(mine.review || "");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [tournamentId, player._id, token, isOwner, userId]);

  const submitRating = async () => {
    if (stars === 0) return setMsg("Please select a star rating.");
    setSaving(true);
    setMsg("");
    try {
      await axios.post(
        `${API_URL}/tournaments/${tournamentId}/ratings`,
        { playerId: player._id, playerName: player.name, stars, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Fetch updated ratings for this player and notify parent
      try {
        const res2 = await axios.get(
          `${API_URL}/tournaments/${tournamentId}/ratings/${player._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAllRatings(res2.data.ratings || []);
        setAverage(res2.data.average || 0);
        setCount(res2.data.count || 0);
        if (typeof onSaved === "function") {
          onSaved({ playerId: player._id, ratings: res2.data.ratings || [], average: res2.data.average || 0, count: res2.data.count || 0 });
        }
      } catch (e) {
        // ignore fetch error but still close
      }
      setMsg("✓ Rating saved!");
      setTimeout(onClose, 1200);
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to save rating");
    } finally {
      setSaving(false);
    }
  };

  const sendReminder = async () => {
    setReminding(true);
    try {
      await axios.post(
        `${API_URL}/tournaments/${tournamentId}/ratings/remind`,
        { playerId: userId, playerName: userName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReminderSent(true);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to send reminder");
    } finally {
      setReminding(false);
    }
  };

  const url = photoUrl(player.photo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl
          shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {url ? (
              <img src={url} alt={player.name}
                className="w-10 h-10 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0a1628]
                flex items-center justify-center text-white font-bold">
                {player.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white font-bold">{player.name}</p>
              <p className="text-slate-400 text-xs">{player.role || "Player"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#f4b942] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Average display */}
              {count > 0 && (
                <div className="flex items-center gap-3 mb-5 p-3 bg-white/5 rounded-xl">
                  <StarDisplay value={average} />
                  <div>
                    <p className="text-white font-bold text-lg">{average}</p>
                    <p className="text-slate-400 text-xs">{count} {count === 1 ? "rating" : "ratings"}</p>
                  </div>
                </div>
              )}

              {/* OWNER: Rating form */}
              {isOwner && (
                <div>
                  <p className="text-slate-300 text-sm mb-3 font-medium">
                    {existing ? "Update your rating" : "Rate this player's performance"}
                  </p>
                  <div className="flex justify-center mb-4">
                    <StarInput value={stars} onChange={setStars} disabled={saving} />
                  </div>

                  {stars > 0 && (
                    <p className="text-center text-yellow-400 text-sm mb-3 font-medium">
                      {["", "Poor", "Below Average", "Average", "Good", "Excellent"][stars]}
                    </p>
                  )}

                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write a short review (optional)..."
                    rows={3}
                    maxLength={500}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white
                      text-sm placeholder:text-slate-500 outline-none focus:border-blue-500/50 resize-none"
                  />
                  <p className="text-slate-600 text-xs text-right mt-0.5 mb-3">
                    {review.length}/500
                  </p>

                  {msg && (
                    <p className={`text-sm text-center mb-3 ${
                      msg.startsWith("✓") ? "text-green-400" : "text-red-400"
                    }`}>{msg}</p>
                  )}

                  <button
                    onClick={submitRating}
                    disabled={saving || stars === 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500
                      hover:from-yellow-400 hover:to-orange-400 text-white font-semibold text-sm
                      transition-all disabled:opacity-40"
                  >
                    {saving ? "Saving..." : existing ? "Update Rating" : "Submit Rating"}
                  </button>
                </div>
              )}

              {/* PLAYER: See their ratings + send reminder */}
              {!isOwner && (
                <div>
                  {count === 0 && (
                    <p className="text-slate-400 text-sm text-center py-4">
                      No ratings yet for this tournament.
                    </p>
                  )}

                  {/* Individual ratings */}
                  {allRatings.length > 0 && (
                    <div className="space-y-3 mb-5">
                      {allRatings.map((r) => (
                        <div key={r._id} className="bg-white/5 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white text-sm font-medium">{r.raterName}</p>
                            <StarDisplay value={r.stars} size={14} />
                          </div>
                          {r.review && (
                            <p className="text-slate-400 text-xs italic">"{r.review}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reminder button */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-slate-400 text-xs mb-3 text-center">
                      Remind the owner to rate your performance
                    </p>
                    {reminderSent ? (
                      <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                        <CheckCircle size={16} /> Reminder sent!
                      </div>
                    ) : (
                      <button
                        onClick={sendReminder}
                        disabled={reminding}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                          bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300
                          text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {reminding ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Bell size={14} />
                        )}
                        Send Reminder to Owner
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
