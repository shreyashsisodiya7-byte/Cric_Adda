import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../api";

/**
 * MatchStatsModal
 * Shown to owners after a booking's eventDate has passed.
 * Owner fills in what the player did in that match — submitted data
 * gets merged into the player's profile stats automatically.
 *
 * Props:
 *   booking    – the booking object (must have _id, playerName, eventName, eventDate)
 *   onClose()  – close without submitting
 *   onSuccess(msg) – called after successful submission
 */
export default function MatchStatsModal({ booking, onClose, onSuccess }) {
  const [stats, setStats] = useState({
    runs: "",
    ballsFaced: "",
    wickets: "",
    oversBowled: "",
    runsConceded: "",
    catches: "",
  });
  const [playerRating, setPlayerRating] = useState(0);   // 1–5 stars
  const [hoverRating, setHoverRating]   = useState(0);
  const [notes, setNotes]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const token = localStorage.getItem("token");

  const set = (key) => (e) => {
    const v = e.target.value;
    // Allow empty string or non-negative numbers only
    if (v === "" || (/^\d*\.?\d*$/.test(v) && Number(v) >= 0)) {
      setStats((p) => ({ ...p, [key]: v }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!playerRating) {
      setError("Please give a match rating (1–5 stars) for the player.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        runs:         Number(stats.runs)         || 0,
        ballsFaced:   Number(stats.ballsFaced)   || 0,
        wickets:      Number(stats.wickets)      || 0,
        oversBowled:  Number(stats.oversBowled)  || 0,
        runsConceded: Number(stats.runsConceded) || 0,
        catches:      Number(stats.catches)      || 0,
        playerRating,
        notes,
      };

      const res = await axios.post(
        `${API_URL}/bookings/${booking._id}/match-stats`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        onSuccess(
          `Stats submitted! ${booking.playerName}'s profile has been updated and your trust score increased. 🏏`
        );
        onClose();
      } else {
        setError(res.data.message || "Failed to submit stats.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit stats.");
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  // Inline styles (matching Profile.jsx light theme)
  const inputCls = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1.5px solid #e8edf2",
    background: "#f8fafc",
    color: "#0a1628",
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.9px",
    color: "#607080",
    marginBottom: 5,
  };

  const starSize = 32;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, background: "rgba(10,22,40,0.72)",
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
          boxShadow: "0 24px 72px rgba(0,0,0,0.18)",
          border: "1.5px solid #e8edf2",
          maxHeight: "90vh", overflowY: "auto",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 100%)",
            borderRadius: "18px 18px 0 0",
            padding: "22px 28px 20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(244,185,66,0.15)", border: "1px solid rgba(244,185,66,0.3)",
                color: "#f4b942", fontSize: 10, fontWeight: 700, letterSpacing: "1.2px",
                padding: "3px 12px", borderRadius: 20, marginBottom: 10, textTransform: "uppercase",
              }}>
                🏏 Post-Match Report
              </div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 26,
                color: "#fff", letterSpacing: 1, lineHeight: 1.15,
              }}>
                Enter Match Stats
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                {booking.playerName} · {booking.eventName} · {fmtDate(booking.eventDate)}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8,
                color: "rgba(255,255,255,0.6)", cursor: "pointer",
                fontSize: 18, padding: "4px 10px", lineHeight: 1,
              }}
            >✕</button>
          </div>

          {/* Obligation notice */}
          <div style={{
            marginTop: 14, background: "rgba(244,185,66,0.12)",
            border: "1px solid rgba(244,185,66,0.25)",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5,
          }}>
            ⚠️ <strong style={{ color: "#f4b942" }}>Required:</strong> Submit stats to unlock new bookings.
            Your trust score also increases with each submission.
          </div>
        </div>

        {/* ── Form body ── */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 28px 28px" }}>

          {error && (
            <div style={{
              marginBottom: 16, padding: "10px 14px", borderRadius: 10, fontSize: 13,
              background: "#fee2e2", border: "1.5px solid #fecaca", color: "#991b1b",
            }}>
              {error}
            </div>
          )}

          {/* ── Star rating ── */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Match Rating for {booking.playerName} *</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setPlayerRating(star)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: 2,
                    fontSize: starSize,
                    color: star <= (hoverRating || playerRating) ? "#f4b942" : "#e8edf2",
                    transition: "color 0.1s, transform 0.1s",
                    transform: star <= (hoverRating || playerRating) ? "scale(1.15)" : "scale(1)",
                    lineHeight: 1,
                  }}
                >★</button>
              ))}
              {playerRating > 0 && (
                <span style={{ fontSize: 13, color: "#607080", marginLeft: 6 }}>
                  {["", "Poor", "Fair", "Good", "Great", "Outstanding"][playerRating]}
                </span>
              )}
            </div>
          </div>

          {/* ── Batting stats ── */}
          <div style={{
            background: "#f0f7ff", border: "1.5px solid #bfdbfe",
            borderRadius: 12, padding: "16px 18px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.8px" }}>
              🏏 Batting
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Runs Scored</label>
                <input
                  type="number" min="0"
                  value={stats.runs}
                  onChange={set("runs")}
                  placeholder="0"
                  style={inputCls}
                  onFocus={(e) => (e.target.style.borderColor = "#f4b942")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e8edf2")}
                />
              </div>
              <div>
                <label style={labelStyle}>Balls Faced</label>
                <input
                  type="number" min="0"
                  value={stats.ballsFaced}
                  onChange={set("ballsFaced")}
                  placeholder="0"
                  style={inputCls}
                  onFocus={(e) => (e.target.style.borderColor = "#f4b942")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e8edf2")}
                />
              </div>
            </div>
          </div>

          {/* ── Bowling stats ── */}
          <div style={{
            background: "#f0fdf4", border: "1.5px solid #a7f3d0",
            borderRadius: 12, padding: "16px 18px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#065f46", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.8px" }}>
              🎯 Bowling
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Wickets</label>
                <input
                  type="number" min="0"
                  value={stats.wickets}
                  onChange={set("wickets")}
                  placeholder="0"
                  style={inputCls}
                  onFocus={(e) => (e.target.style.borderColor = "#f4b942")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e8edf2")}
                />
              </div>
              <div>
                <label style={labelStyle}>Overs Bowled</label>
                <input
                  type="number" min="0" step="0.1"
                  value={stats.oversBowled}
                  onChange={set("oversBowled")}
                  placeholder="0.0"
                  style={inputCls}
                  onFocus={(e) => (e.target.style.borderColor = "#f4b942")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e8edf2")}
                />
              </div>
              <div>
                <label style={labelStyle}>Runs Conceded</label>
                <input
                  type="number" min="0"
                  value={stats.runsConceded}
                  onChange={set("runsConceded")}
                  placeholder="0"
                  style={inputCls}
                  onFocus={(e) => (e.target.style.borderColor = "#f4b942")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e8edf2")}
                />
              </div>
              <div>
                <label style={labelStyle}>Catches</label>
                <input
                  type="number" min="0"
                  value={stats.catches}
                  onChange={set("catches")}
                  placeholder="0"
                  style={inputCls}
                  onFocus={(e) => (e.target.style.borderColor = "#f4b942")}
                  onBlur={(e)  => (e.target.style.borderColor = "#e8edf2")}
                />
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Additional Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Excellent fielding, took a brilliant catch at slip…"
              style={{ ...inputCls, resize: "none" }}
              onFocus={(e) => (e.target.style.borderColor = "#f4b942")}
              onBlur={(e)  => (e.target.style.borderColor = "#e8edf2")}
            />
          </div>

          {/* Trust score notice */}
          <div style={{
            background: "#fef3c7", border: "1.5px solid #fde68a",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 12, color: "#92400e", marginBottom: 20, lineHeight: 1.5,
          }}>
            🏅 Submitting stats earns you <strong>+10 trust points</strong> on your owner profile.
            Higher trust makes players more likely to accept your bookings.
          </div>

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, fontSize: 14,
                fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                background: "#f4f7fb", color: "#607080",
                border: "1.5px solid #e8edf2",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !playerRating}
              style={{
                flex: 2, padding: "12px", borderRadius: 10, fontSize: 14,
                fontWeight: 700, cursor: loading || !playerRating ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                background: loading || !playerRating ? "#e8edf2" : "#f4b942",
                color: loading || !playerRating ? "#9ca3af" : "#0a1628",
                border: "none",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Submitting…" : "Submit Match Stats 🏏"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}