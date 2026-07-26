import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";
import BookingModal from "../components/BookingModal";
import TournamentInviteButton from "../components/TournamentInviteButton";
import { PlayerRatingsPanel, ClickableStarRating } from "../pages/PlayerRating";

// ── Google Fonts
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector(`link[href="${fontLink.href}"]`))
  document.head.appendChild(fontLink);

// ── Helpers
const roleCardBg = {
  Batsman:        "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  Bowler:         "linear-gradient(135deg,#d1fae5,#a7f3d0)",
  "All-Rounder":  "linear-gradient(135deg,#fef3c7,#fde68a)",
  "Wicket Keeper":"linear-gradient(135deg,#ede9fe,#ddd6fe)",
};
const roleEmoji = { Batsman: "🏏", Bowler: "🎯", "All-Rounder": "⚡", "Wicket Keeper": "🧤" };

// ─────────────────────────────────────────────────────────────────────────────
export default function PlayerProfile() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [player, setPlayer]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [deleted, setDeleted]       = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBooking, setShowBooking]   = useState(false);
  const [next10Days, setNext10Days]     = useState([]);

  // We need ONE accepted booking so ClickableStarRating can open the rate modal.
  // If the viewer has no booking with this player, booking stays null → stars are read-only.
  const [viewerBooking, setViewerBooking] = useState(null);

  const currentUserId   = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const currentUserCity = localStorage.getItem("userCity") || "";
  const token           = localStorage.getItem("token");

  useEffect(() => {
    // Load player profile
    axios.get(`${API_URL}/players/profile/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.data.data) { setDeleted(true); return; }
        setPlayer(r.data.data);
      })
      .catch((e) => {
        if (e.response?.status === 404 || e.response?.status === 410) setDeleted(true);
      })
      .finally(() => setLoading(false));

    setNext10Days(Array.from({ length: 10 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i); return d;
    }));

    // Load a booking between current viewer and this player (for rating)
    if (currentUserId && token) {
      axios.get(`${API_URL}/bookings/between/${currentUserId}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => {
          // Accept the first accepted booking found, if any
          const accepted = r.data?.bookings?.find((b) => b.status === "accepted");
          if (accepted) setViewerBooking(accepted);
        })
        .catch(() => {}); // no booking is fine — stars just become read-only
    }
  }, [id]);

  const handleBook = (date = null) => {
    if (!currentUserId) { toast.error("Please login first"); navigate("/Log_SignUp"); return; }
    setSelectedDate(date);
    setShowBooking(true);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100vh", background: "#f4f7fb",
      fontFamily: "'DM Sans', sans-serif", color: "#0a1628", paddingTop: 64,
    },
    heroBand: {
      background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 55%,#0f2d1e 100%)",
      padding: "48px 2.5rem 56px",
    },
    heroInner:  { maxWidth: 900, margin: "0 auto" },
    heroCard: {
      background: "rgba(255,255,255,0.05)",
      border: "1.5px solid rgba(255,255,255,0.12)",
      borderRadius: 20, padding: "28px 28px 32px",
      display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start",
    },
    avatarWrap: { position: "relative", flexShrink: 0 },
    avatarImg: {
      width: 110, height: 110, borderRadius: "50%",
      objectFit: "cover", border: "4px solid #f4b942",
      boxShadow: "0 0 28px rgba(244,185,66,0.35)", display: "block",
    },
    avatarFallback: (bg) => ({
      width: 110, height: 110, borderRadius: "50%",
      background: bg || "#0a1628",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 44, border: "4px solid #f4b942",
      boxShadow: "0 0 28px rgba(244,185,66,0.35)",
    }),
    availDot: (avail) => ({
      position: "absolute", bottom: 6, right: 6,
      width: 18, height: 18, borderRadius: "50%",
      background: avail ? "#10b981" : "#9ca3af", border: "3px solid #0a1628",
    }),
    heroRight:      { flex: 1, minWidth: 220 },
    roleTag: {
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "rgba(244,185,66,0.15)", border: "1px solid rgba(244,185,66,0.3)",
      color: "#f4b942", fontSize: 12, fontWeight: 600, letterSpacing: "1.2px",
      padding: "4px 14px", borderRadius: 20, marginBottom: 12, textTransform: "uppercase",
    },
    playerName: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: "clamp(36px,6vw,58px)", color: "#fff",
      letterSpacing: 2, lineHeight: 1, marginBottom: 8,
    },
    locationLine: {
      fontSize: 14, color: "rgba(255,255,255,0.6)",
      marginBottom: 12, display: "flex", gap: 14, flexWrap: "wrap",
    },
    infoChip: {
      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#fff",
      display: "flex", flexDirection: "column", gap: 2,
    },
    infoChipLabel: { fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.8px" },
    infoChipVal:   { fontWeight: 600 },
    infoRow:       { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 },
    btnBook: {
      padding: "13px 36px", borderRadius: 10, fontWeight: 700, fontSize: 15,
      background: "#f4b942", color: "#0a1628", border: "none",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    btnGhost: {
      padding: "13px 24px", borderRadius: 10, fontWeight: 600, fontSize: 14,
      background: "transparent", color: "rgba(255,255,255,0.7)",
      border: "1.5px solid rgba(255,255,255,0.3)",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    btnRow: {
      display: "flex", gap: 12, alignItems: "center",
      paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 4,
    },
    content:   { maxWidth: 900, margin: "0 auto", padding: "32px 2.5rem 72px" },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 24 },
    statCard: (accent) => ({
      background: "#fff", border: "1.5px solid #e8edf2", borderRadius: 14,
      padding: "20px", textAlign: "center", borderTop: `4px solid ${accent}`,
    }),
    statVal:   { fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: "#0a1628", lineHeight: 1 },
    statLabel: { fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 6 },
    sectionCard: {
      background: "#fff", border: "1.5px solid #e8edf2", borderRadius: 16,
      padding: "24px", marginBottom: 20,
    },
    sectionTitle: {
      fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#0a1628",
      marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
    },
    sectionTag: {
      display: "inline-block", background: "#e8f5e9", color: "#1b5e20",
      fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase",
      padding: "3px 10px", borderRadius: 20,
    },
    aboutBox: {
      background: "#f8fafc", border: "1.5px solid #e8edf2", borderRadius: 10,
      padding: "16px 18px", fontSize: 14, color: "#374151", lineHeight: 1.75,
    },
    availGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px,1fr))", gap: 10 },
    dateCard: (avail) => ({
      borderRadius: 12, padding: "12px 8px", textAlign: "center",
      border: `1.5px solid ${avail ? "#a7f3d0" : "#e8edf2"}`,
      background: avail ? "#f0fdf4" : "#f8fafc",
      cursor: avail ? "pointer" : "default",
      transition: "transform 0.15s, border-color 0.15s",
    }),
    dayLabel:   { fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" },
    dateNum:    { fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#0a1628", lineHeight: 1, margin: "3px 0" },
    monthLabel: { fontSize: 10, color: "#9ca3af" },
    availLabel: (avail) => ({ fontSize: 10, fontWeight: 700, marginTop: 6, color: avail ? "#059669" : "#9ca3af" }),
  };

  // ── Loading / deleted / not found states ───────────────────────────────────
  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #e8edf2", borderTopColor: "#f4b942", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#0a1628" }}>Loading Player</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (deleted) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ animation: "fadeUp .5s ease", textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", margin: "0 auto 20px", background: "linear-gradient(135deg,#e8edf2,#d0d8e4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, border: "3px dashed #c8d0dc" }}>👻</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, color: "#0a1628", letterSpacing: 1, marginBottom: 8 }}>Account Deleted</div>
        <p style={{ color: "#607080", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
          This player has deleted their account.<br />Their profile, stats, and bookings are no longer available.
        </p>
        <div style={{ height: 1, background: "#e8edf2", margin: "0 0 24px" }} />
        <p style={{ color: "#9aacbb", fontSize: 13, marginBottom: 20 }}>Looking for someone to play with?</p>
        <button onClick={() => navigate("/FindPlayers")} style={{ background: "#f4b942", color: "#0a1628", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Browse Active Players
        </button>
      </div>
    </div>
  );

  if (!player) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 52 }}>🏏</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#0a1628" }}>Player Not Found</div>
      <button style={{ ...S.btnBook, marginTop: 8 }} onClick={() => navigate("/FindPlayers")}>Browse Players</button>
    </div>
  );

  const battingAvg = player.stats.matches > 0 ? (player.stats.runs / player.stats.matches).toFixed(1) : "0.0";
  const bowlingAvg = player.stats.wickets > 0 ? (player.stats.runs / player.stats.wickets).toFixed(1) : "—";
  const photoSrc   = player.photo ? `${API_URL}/uploads/${player.photo}` : null;
  const roleBg     = roleCardBg[player.role] || "linear-gradient(135deg,#f0f4ff,#e0e7ff)";
  const roleEmo    = roleEmoji[player.role] || "🏏";
  const isAvailNow = player.status?.toLowerCase() === "available" || player.availability?.[0];

  const STATS = [
    { label: "Matches",     val: player.stats.matches || 0,  accent: "#3b82f6" },
    { label: "Runs",        val: player.stats.runs || 0,     accent: "#10b981" },
    { label: "Wickets",     val: player.stats.wickets || 0,  accent: "#f4b942" },
    { label: "Batting Avg", val: battingAvg,                 accent: "#8b5cf6" },
    ...(player.stats.wickets > 0 ? [{ label: "Bowling Avg", val: bowlingAvg, accent: "#ec4899" }] : []),
  ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .date-card-avail:hover { transform: translateY(-2px); border-color: #f4b942 !important; }
        @media (max-width: 600px) {
          .hero-card { flex-direction: column; align-items: center; text-align: center; }
          .info-row  { justify-content: center; }
          .btn-row   { justify-content: center; }
        }
      `}</style>

      <div style={S.page}>

        {/* ── HERO BAND ── */}
        <section style={S.heroBand}>
          <div style={S.heroInner}>
            <div style={S.heroCard} className="hero-card">

              {/* Avatar */}
              <div style={S.avatarWrap}>
                {photoSrc
                  ? <img src={photoSrc} alt={player.name} style={S.avatarImg} />
                  : <div style={S.avatarFallback(roleBg)}>{roleEmo}</div>
                }
                <div style={S.availDot(isAvailNow)} title={isAvailNow ? "Available" : "Unavailable"} />
              </div>

              {/* Info */}
              <div style={S.heroRight}>
                <div style={S.roleTag}>{roleEmo} {player.role}</div>
                <h1 style={S.playerName}>{player.name}</h1>

                <div style={S.locationLine}>
                  <span>📍 {player.city || "Unknown"}</span>
                  <span>💰 ₹{player.fee || 0}/match</span>
                  <span style={{ color: isAvailNow ? "#34d399" : "#9ca3af" }}>
                    {isAvailNow ? "● Available" : "● Unavailable"}
                  </span>
                </div>

                {/* ── STAR RATING — below location, above info chips ── */}
                {/* Fetches real average; clickable to rate if viewer has a booking */}
                <div style={{ marginBottom: 16 }}>
                  <ClickableStarRating
                    playerId={player._id}
                    booking={viewerBooking}   // null = read-only stars
                    onRated={() => {}}        // panel below will reflect on next load
                  />
                </div>

                <div style={{ ...S.infoRow, marginTop: 0 }} className="info-row">
                  {[
                    { label: "Role",    val: player.role },
                    { label: "Fee",     val: `₹${player.fee || 0}/match` },
                    { label: "City",    val: player.city || "N/A" },
                    { label: "Matches", val: player.stats.matches || 0 },
                  ].map(({ label, val }) => (
                    <div key={label} style={S.infoChip}>
                      <span style={S.infoChipLabel}>{label}</span>
                      <span style={S.infoChipVal}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={S.btnRow} className="btn-row">
                  <button
                    style={S.btnBook}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    onClick={() => handleBook()}
                  >
                    🏏 Book This Player
                  </button>
                  <TournamentInviteButton
                    player={{ _id: player._id, name: player.name, role: player.role, photo: player.photo }}
                    token={token}
                    userId={currentUserId}
                  />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                    or pick a date from the calendar below
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTENT ── */}
        <div style={S.content}>

          {/* Stats */}
          <div style={{ marginBottom: 6 }}>
            <span style={S.sectionTag}>Performance Stats</span>
          </div>
          <div style={S.statsGrid}>
            {STATS.map((s) => (
              <div key={s.label} style={S.statCard(s.accent)}>
                <div style={S.statVal}>{s.val}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── RATINGS PANEL — below stats ── */}
          <PlayerRatingsPanel playerId={player._id} />

          {/* About */}
          <div style={S.sectionCard}>
            <div style={S.sectionTitle}><span>📖</span> About</div>
            <div style={S.aboutBox}>
              {player.about || "No information added yet. Check back later."}
            </div>
          </div>

          {/* Availability */}
          <div style={S.sectionCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={S.sectionTitle}>
                <span>📅</span> Availability — Next 10 Days
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block" }} /> Available
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e5e7eb", display: "inline-block" }} /> Busy
                </span>
              </div>
            </div>

            <div style={S.availGrid}>
              {next10Days.map((date, i) => {
                const avail   = !!player.availability?.[i];
                const dateStr = date.toISOString().split("T")[0];
                return (
                  <div
                    key={i}
                    style={S.dateCard(avail)}
                    className={avail ? "date-card-avail" : ""}
                    onClick={() => avail && handleBook(dateStr)}
                    title={avail ? `Book for ${dateStr}` : "Not available"}
                  >
                    <div style={S.dayLabel}>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div style={S.dateNum}>{date.getDate()}</div>
                    <div style={S.monthLabel}>{date.toLocaleDateString("en-US", { month: "short" })}</div>
                    <div style={S.availLabel(avail)}>{avail ? "✓ Free" : "✗ Busy"}</div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 14 }}>
              💡 Click on a green date to book the player for that specific day.
            </p>
          </div>

        </div>

        {/* Booking Modal */}
        {showBooking && player && (
          <BookingModal
            playerId={player._id}
            playerName={player.name}
            playerFee={player.fee}
            date={selectedDate}
            onClose={() => { setShowBooking(false); setSelectedDate(null); }}
            onSuccess={() => { setShowBooking(false); setSelectedDate(null); }}
            ownerId={currentUserId}
            ownerName={currentUserName}
            ownerCity={currentUserCity}
          />
        )}

      </div>
    </>
  );
}