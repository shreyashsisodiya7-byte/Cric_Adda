import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../api";

// ── Star display (read-only) ─────────────────────────────────────────────────
export function StarDisplay({ rating, size = "md", showCount = false, count = 0 }) {
  const filled = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - filled - (half ? 1 : 0);

  return (
    <span className={`inline-flex items-center gap-1 text-2xl`}>
      <span className="text-yellow-400">
        {"★".repeat(filled)}
        {half ? "⯨" : ""}
        <span className="text-slate-600">{"☆".repeat(empty)}</span>
      </span>
      {rating > 0 && (
        <span className="text-slate-400 text-xs font-medium ml-0.5">
          {rating.toFixed(1)}
          {showCount && count > 0 && (
            <span className="text-slate-600 ml-1">({count})</span>
          )}
        </span>
      )}
    </span>
  );
}

// ── Clickable star display — fetches real avg, opens rate modal on click ──────
// Place this wherever you want stars shown + tap-to-rate behavior.
// Props:
//   playerId   — the player's _id
//   booking    — a booking object (needed by RatePlayerModal); pass null to make stars read-only
//   onRated    — optional callback after a rating is submitted
export function ClickableStarRating({ playerId, booking = null, onRated }) {
  const [avgStars, setAvgStars]       = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [showModal, setShowModal]     = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [checking, setChecking]       = useState(true);

  const currentUserId = localStorage.getItem("userId");
  const token         = localStorage.getItem("token");
  const isOwnProfile  = playerId === currentUserId;

  // Fetch average rating for display
  useEffect(() => {
    if (!playerId) return;
    axios
      .get(`${API_URL}/ratings/player/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          setAvgStars(res.data.averageStars || 0);
          setTotalRatings(res.data.totalRatings || 0);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [playerId]);

  // Check if current user already rated (only when a booking is provided)
  useEffect(() => {
    if (!booking?._id || !currentUserId) { setChecking(false); return; }
    axios
      .get(`${API_URL}/ratings/check/${booking._id}/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAlreadyRated(!!res.data.rated))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [booking?._id, currentUserId]);

  const canRate = booking && !isOwnProfile && !alreadyRated && currentUserId;

  const handleClick = () => {
    if (canRate) setShowModal(true);
  };

  const filled = Math.floor(avgStars);
  const half   = avgStars % 1 >= 0.5;
  const empty  = 5 - filled - (half ? 1 : 0);

  return (
    <>
      <div
        onClick={handleClick}
        title={
          isOwnProfile     ? "Your rating"
          : alreadyRated   ? "Already rated"
          : !booking       ? `${avgStars.toFixed(1)} stars`
          : canRate        ? "Tap stars to rate this player"
          : ""
        }
        style={{
          display:    "inline-flex",
          alignItems: "center",
          gap:        6,
          cursor:     canRate ? "pointer" : "default",
          userSelect: "none",
          padding:    "4px 0",
        }}
      >
        <span style={{ color: "#f4b942", fontSize: 18, letterSpacing: 2 }}>
          {"★".repeat(filled)}
          {half ? "⯨" : ""}
          <span style={{ color: "rgba(255,255,255,0.25)" }}>{"☆".repeat(empty)}</span>
        </span>

        {totalRatings > 0 ? (
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
            {avgStars.toFixed(1)}
            <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>
              ({totalRatings})
            </span>
          </span>
        ) : (
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
            {canRate ? "Tap to rate" : "No ratings yet"}
          </span>
        )}
      </div>

      {showModal && booking && (
        <RatePlayerModal
          booking={booking}
          onClose={() => setShowModal(false)}
          onRated={(rating) => {
            setAlreadyRated(true);
            // optimistically update displayed average
            const newTotal = totalRatings + 1;
            setAvgStars(
              parseFloat(
                ((avgStars * totalRatings + rating.stars) / newTotal).toFixed(1)
              )
            );
            setTotalRatings(newTotal);
            onRated?.(rating);
          }}
        />
      )}
    </>
  );
}

// ── Interactive star picker ───────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-3xl transition-transform hover:scale-110 focus:outline-none"
        >
          <span
            className={
              hovered >= star || value >= star ? "text-yellow-400" : "text-slate-700"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Rating Modal (any logged-in user can rate a player) ──────────────────────
export function RatePlayerModal({ booking, onClose, onRated }) {
  const [stars, setStars]   = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const currentUserId   = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const token           = localStorage.getItem("token");

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const submit = async () => {
    if (stars === 0) return setError("Please select a star rating");
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_URL}/ratings`,
        {
          bookingId:  booking._id,
          raterId:    currentUserId,
          raterName:  currentUserName,
          playerId:   booking.playerId,
          playerName: booking.playerName,
          stars,
          review,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        onRated?.(res.data.rating);
        onClose();
      } else {
        setError(res.data.message);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative", width: "100%", maxWidth: 360,
          background: "linear-gradient(to bottom, #1e293b, #0f172a)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24, padding: 24,
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 17, margin: 0 }}>Rate Player</p>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "4px 0 0" }}>{booking.playerName}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Event info */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "10px 14px", marginBottom: 20,
        }}>
          <p style={{ color: "#fff", fontSize: 13, fontWeight: 500, margin: 0 }}>{booking.eventName}</p>
          <p style={{ color: "#64748b", fontSize: 11, margin: "4px 0 0" }}>
            {new Date(booking.eventDate).toDateString()}
          </p>
        </div>

        {/* Star picker */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStars(star)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  fontSize: 36,
                  color: stars >= star ? "#f4b942" : "rgba(255,255,255,0.15)",
                  transform: "scale(1)", transition: "transform 0.1s, color 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.15)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >★</button>
            ))}
          </div>
          {stars > 0 && (
            <p style={{ color: "#f4b942", fontSize: 13, fontWeight: 600, marginTop: 8 }}>
              {labels[stars]}
            </p>
          )}
        </div>

        {/* Review textarea */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>Write a review (optional)</p>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="How was the player's performance?"
            rows={3}
            maxLength={500}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "10px 14px",
              color: "#fff", fontSize: 13,
              resize: "none", outline: "none",
              fontFamily: "inherit",
            }}
          />
          <p style={{ color: "#475569", fontSize: 11, textAlign: "right", marginTop: 2 }}>
            {review.length}/500
          </p>
        </div>

        {error && (
          <p style={{ color: "#f87171", fontSize: 12, textAlign: "center", marginBottom: 12 }}>{error}</p>
        )}

        <button
          onClick={submit}
          disabled={loading || stars === 0}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 14,
            fontSize: 14, fontWeight: 700, border: "none", cursor: loading || stars === 0 ? "not-allowed" : "pointer",
            background: loading || stars === 0 ? "rgba(244,185,66,0.3)" : "#f4b942",
            color: loading || stars === 0 ? "rgba(255,255,255,0.4)" : "#0a1628",
            transition: "opacity 0.2s",
            fontFamily: "inherit",
          }}
        >
          {loading ? "Submitting…" : "⭐ Submit Rating"}
        </button>
      </div>
    </div>
  );
}

// ── Reminder button ───────────────────────────────────────────────────────────
export function ReminderButton({ booking }) {
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUserId   = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const token           = localStorage.getItem("token");

  const sendReminder = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/ratings/reminder`,
        {
          bookingId: booking._id,
          raterId:   currentUserId,
          raterName: currentUserName,
          playerId:  booking.playerId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSent(true);
        setTimeout(() => setSent(false), 4000);
      } else {
        alert(res.data.message);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to send reminder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={sendReminder}
      disabled={loading || sent}
      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
        sent
          ? "bg-green-500/20 text-green-400 border-green-500/30"
          : "bg-white/5 text-slate-400 hover:text-yellow-400 border-white/10 hover:border-yellow-500/30"
      } disabled:opacity-60`}
    >
      {sent ? "✓ Reminder sent!" : loading ? "…" : "🔔 Remind to rate"}
    </button>
  );
}

// ── Player Ratings Panel (shown below stats on PlayerProfile) ─────────────────
export function PlayerRatingsPanel({ playerId }) {
  const [data, setData] = useState({ ratings: [], averageStars: 0, totalRatings: 0 });
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!playerId) return;
    axios
      .get(`${API_URL}/ratings/player/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => { if (res.data.success) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return (
      <div style={{
        background: "#fff", border: "1.5px solid #e8edf2", borderRadius: 14,
        padding: 20, marginBottom: 20, animation: "pulse 1.5s infinite",
      }}>
        <div style={{ height: 14, background: "#f1f5f9", borderRadius: 8, width: 120, marginBottom: 10 }} />
        <div style={{ height: 24, background: "#f1f5f9", borderRadius: 8, width: 80 }} />
      </div>
    );
  }

  const starBars = [5, 4, 3, 2, 1].map((s) => {
    const count = data.ratings.filter((r) => r.stars === s).length;
    const pct   = data.totalRatings > 0 ? (count / data.totalRatings) * 100 : 0;
    return { star: s, count, pct };
  });

  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e8edf2", borderRadius: 14,
      padding: 20, marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "#0a1628",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ⭐ Player Ratings
        </span>
        {data.totalRatings > 0 && (
          <button
            onClick={() => setExpanded((p) => !p)}
            style={{
              fontSize: 12, color: "#6b7280", background: "none", border: "none",
              cursor: "pointer", padding: 0,
            }}
          >
            {expanded ? "Hide reviews ▲" : "Show reviews ▼"}
          </button>
        )}
      </div>

      {data.totalRatings === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>No ratings yet</p>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Big score */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "#f4b942", lineHeight: 1, margin: 0 }}>
              {data.averageStars.toFixed(1)}
            </p>
            <span style={{ color: "#f4b942", fontSize: 16, letterSpacing: 2 }}>
              {"★".repeat(Math.round(data.averageStars))}
              {"☆".repeat(5 - Math.round(data.averageStars))}
            </span>
            <p style={{ color: "#9ca3af", fontSize: 11, marginTop: 4 }}>
              {data.totalRatings} review{data.totalRatings !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Bar breakdown */}
          <div style={{ flex: 1 }}>
            {starBars.map(({ star, count, pct }) => (
              <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280", width: 12, textAlign: "right" }}>{star}</span>
                <span style={{ color: "#f4b942", fontSize: 12 }}>★</span>
                <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: "#f4b942", borderRadius: 99,
                    width: `${pct}%`, transition: "width 0.4s ease",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af", width: 14 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual reviews */}
      {expanded && data.ratings.length > 0 && (
        <div style={{ marginTop: 16, borderTop: "1.5px solid #e8edf2", paddingTop: 16 }}>
          {data.ratings.map((r) => (
            <div key={r._id} style={{
              background: "#f8fafc", borderRadius: 10, padding: "12px 14px",
              marginBottom: 10, border: "1px solid #e8edf2",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0a1628" }}>
                    {r.raterName ?? r.ownerName}
                  </span>
                  <span style={{ color: "#f4b942", fontSize: 13, letterSpacing: 1 }}>
                    {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
              {r.review && (
                <p style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic", margin: 0 }}>
                  "{r.review}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Rate Button (any user, any role) ──────────────────────────────────────────
export function RateBookingButton({ booking, onRated }) {
  const [showModal, setShowModal]       = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(null);
  const [checking, setChecking]         = useState(true);

  const currentUserId = localStorage.getItem("userId");
  const token         = localStorage.getItem("token");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/ratings/check/${booking._id}/${currentUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAlreadyRated(res.data.rated ? res.data.rating : false);
      } catch (_) {
        setAlreadyRated(false);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [booking._id, currentUserId, token]);

  if (booking.playerId === currentUserId) return null;
  if (checking) return <div style={{ height: 24, width: 80, background: "rgba(255,255,255,0.05)", borderRadius: 8 }} />;

  if (alreadyRated) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Your rating:</span>
        <span style={{ color: "#f4b942", fontSize: 14 }}>
          {"★".repeat(alreadyRated.stars)}{"☆".repeat(5 - alreadyRated.stars)}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
          background: "rgba(244,185,66,0.15)", color: "#f4b942",
          border: "1px solid rgba(244,185,66,0.3)", cursor: "pointer",
        }}
      >
        ⭐ Rate Player
      </button>
      {showModal && (
        <RatePlayerModal
          booking={booking}
          onClose={() => setShowModal(false)}
          onRated={(rating) => {
            setAlreadyRated(rating);
            onRated?.(rating);
          }}
        />
      )}
    </>
  );
}