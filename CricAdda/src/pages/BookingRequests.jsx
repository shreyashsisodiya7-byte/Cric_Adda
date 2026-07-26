import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import { RateBookingButton, ReminderButton } from "../pages/PlayerRating";
import MatchStatsModal from "../components/Matchstatsmodal";

// ── Google Fonts ──────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector(`link[href="${fontLink.href}"]`))
  document.head.appendChild(fontLink);

// ── Helpers ───────────────────────────────────────────────────────────────────
const TAB_OPTIONS = [
  { key: "pending",  label: "Pending",  emoji: "⏳" },
  { key: "upcoming", label: "Upcoming", emoji: "📅" },
  { key: "past",     label: "Past",     emoji: "✅" },
  { key: "recent",   label: "Recent",   emoji: "🕐" },
  { key: "all",      label: "All",      emoji: "📋" },
];

const getDayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isUpcoming  = (i) => i.eventDate && new Date(i.eventDate) >= getDayStart(new Date());
const isPast      = (i) => i.eventDate && new Date(i.eventDate) <  getDayStart(new Date());
const isRecent    = (i) => new Date(i.createdAt || i.eventDate) >= new Date(Date.now() - 14*86400*1000);

const filterBookings = (items, f) => {
  const arr = items || [];
  switch (f) {
    case "pending":  return arr.filter((i) => i.status === "pending");
    case "upcoming": return arr.filter(isUpcoming);
    case "past":     return arr.filter(isPast);
    case "recent":   return arr.filter(isRecent);
    default:         return arr;
  }
};

const STATUS_MAP = {
  pending:  { bg: "#fef3c7", text: "#92400e", border: "#fde68a", label: "Pending"  },
  accepted: { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0", label: "Accepted" },
  rejected: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca", label: "Rejected" },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, count, emoji }) {
  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e8edf2", borderRadius: 14,
      padding: "18px 20px", textAlign: "center", minWidth: 100,
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, color: "#0a1628", lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function BookingRequests() {
  const [allRequests, setAllRequests]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [filter, setFilter]               = useState("all");
  const [respondingId, setRespondingId]   = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [cancelingId, setCancelingId]     = useState(null);
  const [cancelReason, setCancelReason]   = useState("");
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [, setPrevIds]                    = useState([]);
  const [actionMsg, setActionMsg]         = useState({ id: null, text: "", ok: true });
  const [statsModal, setStatsModal]       = useState(null); // booking object or null
  const [pendingStatsCount, setPendingStatsCount] = useState(0);
  const [statsToast, setStatsToast]       = useState("");
  const navigate = useNavigate();

  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const userId   = user._id || user.id || localStorage.getItem("userId");
  const userType = user.userType || localStorage.getItem("userType") || "Player";
  const isOwner  = userType === "Owner";
  const token    = localStorage.getItem("token");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const endpoint = isOwner
        ? `/bookings/owner/${userId}`
        : `/bookings/player/${userId}/all`;
      const res = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const items = res.data.requests || res.data.bookings || [];
        const ids = items.map((i) => i._id);
        setAllRequests(items);
        setPrevIds((prev) => {
          if (prev.length > 0 && ids.some((id) => !prev.includes(id))) setHasNewRequest(true);
          return ids;
        });
      } else setError("Unable to load booking requests.");
    } catch { setError("Failed to load booking requests."); }
    finally { setLoading(false); }
  }, [isOwner, userId, token]);

  const fetchPendingStats = useCallback(async () => {
    if (!isOwner) return;
    try {
      const res = await axios.get(`${API_URL}/bookings/owner/${userId}/pending-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setPendingStatsCount(res.data.count || 0);
    } catch { return; }
  }, [isOwner, userId, token]);

  useEffect(() => {
    if (!userId) { navigate("/Log_SignUp"); return; }
    fetchRequests();
    fetchPendingStats();
    const t = setInterval(() => { fetchRequests(); fetchPendingStats(); }, 15000);
    return () => clearInterval(t);
  }, [userId, userType, navigate, fetchRequests, fetchPendingStats]);

  const showMsg = (id, text, ok = true) => {
    setActionMsg({ id, text, ok });
    setTimeout(() => setActionMsg({ id: null, text: "", ok: true }), 3000);
  };

  const handleAccept = async (bookingId) => {
    try {
      const res = await axios.put(`${API_URL}/bookings/${bookingId}/accept`,
        { playerResponse: responseMessage.trim() || "Request accepted" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showMsg(bookingId, "Request accepted! You can now message the owner.");
        setResponseMessage(""); setRespondingId(null);
        setAllRequests((prev) => prev.map((i) => i._id === bookingId ? { ...i, status: "accepted", playerResponse: responseMessage.trim() || "Request accepted" } : i));
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to accept request.";
      showMsg(bookingId, message, false);
    }
  };

  const handleReject = async (bookingId) => {
    const reason = responseMessage.trim();
    if (!reason) return showMsg(bookingId, "Please add a reason for rejection.", false);
    try {
      const res = await axios.put(`${API_URL}/bookings/${bookingId}/reject`,
        { playerResponse: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showMsg(bookingId, "Request rejected.");
        setResponseMessage(""); setRespondingId(null);
        setAllRequests((prev) => prev.map((i) => i._id === bookingId ? { ...i, status: "rejected", playerResponse: reason } : i));
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to reject request.";
      showMsg(bookingId, message, false);
    }
  };

  const handlePlayerCancel = async (bookingId) => {
    const reason = cancelReason.trim();
    if (!reason) return showMsg(bookingId, "Please provide a reason to cancel the accepted booking.", false);
    try {
      const res = await axios.put(`${API_URL}/bookings/${bookingId}/reject`,
        { playerResponse: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showMsg(bookingId, "Accepted booking cancelled.");
        setCancelReason(""); setCancelingId(null);
        setAllRequests((prev) => prev.map((i) => i._id === bookingId ? { ...i, status: "rejected", playerResponse: reason } : i));
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to cancel accepted booking.";
      showMsg(bookingId, message, false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      const res = await axios.delete(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        showMsg(bookingId, "Booking request cancelled.");
        setAllRequests((prev) => prev.filter((i) => i._id !== bookingId));
      } else {
        showMsg(bookingId, res.data.message || "Unable to cancel booking.", false);
      }
    } catch {
      showMsg(bookingId, "Failed to cancel booking.", false);
    }
  };

  const requests = filterBookings(allRequests, filter);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100vh", background: "#f4f7fb",
      fontFamily: "'DM Sans', sans-serif", color: "#0a1628",
      paddingTop: 64,
    },
    hero: {
      background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 55%,#0f2d1e 100%)",
      padding: "44px 2.5rem 48px",
    },
    heroInner: { maxWidth: 1100, margin: "0 auto" },
    eyebrow: {
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
      color: "#f4b942", fontSize: 11, fontWeight: 600, letterSpacing: "1.5px",
      padding: "4px 14px", borderRadius: 20, marginBottom: 16, textTransform: "uppercase",
    },
    heroTitle: {
      fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(32px,5vw,52px)",
      color: "#fff", letterSpacing: 2, lineHeight: 1, marginBottom: 8,
    },
    heroSub: { fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 520, lineHeight: 1.6 },
    heroRow: {
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      flexWrap: "wrap", gap: 24, marginTop: 0,
    },
    statsRow: { display: "flex", gap: 12, flexWrap: "wrap" },

    // Filter bar
    filterBar: {
      background: "#fff", borderBottom: "1.5px solid #e8edf2",
      padding: "14px 2.5rem", position: "sticky", top: 64, zIndex: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },
    filterInner: { maxWidth: 1100, margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
    tabBtn: (active) => ({
      padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      border: active ? "none" : "1.5px solid #e8edf2",
      background: active ? "#0a1628" : "transparent",
      color: active ? "#f4b942" : "#607080",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
    }),

    // Content
    content: { maxWidth: 1100, margin: "28px auto", padding: "0 2.5rem 72px" },

    // Booking card
    card: {
      background: "#fff", border: "1.5px solid #e8edf2", borderRadius: 16,
      padding: "24px", marginBottom: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 16 },
    eventName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#0a1628", marginBottom: 4 },
    partyLine: { fontSize: 13, color: "#607080" },
    partyHighlight: { color: "#1e40af", fontWeight: 600 },
    metaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 },
    metaBox: {
      background: "#f8fafc", border: "1.5px solid #e8edf2", borderRadius: 10,
      padding: "12px 14px",
    },
    metaLabel: { fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 },
    metaVal: { fontSize: 14, fontWeight: 600, color: "#0a1628" },
    msgBox: {
      background: "#f8fafc", border: "1.5px solid #e8edf2", borderRadius: 10,
      padding: "14px 16px", marginBottom: 12,
    },
    msgLabel: { fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 },
    msgText: { fontSize: 14, color: "#374151", lineHeight: 1.65 },
    actionRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
    btnGold: {
      padding: "11px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
      background: "#f4b942", color: "#0a1628", border: "none",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    btnNavy: {
      padding: "11px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
      background: "#0a1628", color: "#f4b942", border: "none",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    btnGhost: {
      padding: "11px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      background: "transparent", color: "#607080",
      border: "1.5px solid #e8edf2", cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
    },
    btnGreen: {
      padding: "11px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
      background: "#059669", color: "#fff", border: "none",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    btnRed: {
      padding: "11px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
      background: "#dc2626", color: "#fff", border: "none",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    textarea: {
      width: "100%", borderRadius: 10, border: "1.5px solid #e8edf2",
      background: "#f8fafc", padding: "12px 14px", fontSize: 14,
      color: "#0a1628", resize: "none", outline: "none",
      fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
    },
    respondBox: {
      background: "#f8fafc", border: "1.5px solid #e8edf2",
      borderRadius: 12, padding: "16px", marginTop: 14,
    },
  };

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .meta-grid { grid-template-columns: 1fr 1fr !important; }
          .card-top { flex-direction: column !important; }
          .action-row { flex-direction: column !important; }
          .action-row button { width: 100% !important; }
        }
      `}</style>

      {/* ── Match Stats Modal ── */}
      {statsModal && (
        <MatchStatsModal
          booking={statsModal}
          onClose={() => setStatsModal(null)}
          onSuccess={(msg) => {
            setStatsToast(msg);
            setTimeout(() => setStatsToast(""), 4000);
            setPendingStatsCount((p) => Math.max(0, p - 1));
            setAllRequests((prev) =>
              prev.map((b) => b._id === statsModal._id ? { ...b, statsSubmitted: true } : b)
            );
            setStatsModal(null);
          }}
        />
      )}

      {/* ── Stats toast ── */}
      {statsToast && (
        <div style={{
          position: "fixed", top: 80, right: 20, zIndex: 700,
          background: "#d1fae5", border: "1.5px solid #a7f3d0",
          color: "#065f46", padding: "12px 20px", borderRadius: 12,
          fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          maxWidth: 340,
        }}>
          {statsToast}
        </div>
      )}

      <div style={S.page}>

        {/* ── HERO ── */}
        <section style={S.hero}>
          <div style={S.heroInner}>
            <div style={S.heroRow}>
              <div>
                <span style={S.eyebrow}>📩 Booking Centre</span>
                <h1 style={S.heroTitle}>BOOKING REQUESTS</h1>
                <p style={S.heroSub}>
                  Track all your pending, upcoming, past and recent booking requests in one place.
                </p>
              </div>
              <div style={S.statsRow}>
                {TAB_OPTIONS.filter((t) => t.key !== "all").map((tab) => (
                  <StatCard
                    key={tab.key}
                    label={tab.label}
                    count={filterBookings(allRequests, tab.key).length}
                    emoji={tab.emoji}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FILTER TABS ── */}
        <div style={S.filterBar}>
          <div style={S.filterInner}>
            {TAB_OPTIONS.map((tab) => (
              <button
                key={tab.key}
                style={S.tabBtn(filter === tab.key)}
                onClick={() => { setFilter(tab.key); if (tab.key === "pending") setHasNewRequest(false); }}
              >
                {tab.emoji} {tab.label}
                {tab.key === "pending" && hasNewRequest && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── PENDING STATS OBLIGATION BANNER (owner only) ── */}
        {isOwner && pendingStatsCount > 0 && (
          <div style={{ maxWidth: 1100, margin: "16px auto 0", padding: "0 2.5rem" }}>
            <div style={{
              background: "#fff7ed", border: "2px solid #fdba74",
              borderRadius: 12, padding: "14px 20px",
              display: "flex", alignItems: "flex-start", gap: 14,
            }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>🔒</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 17,
                  color: "#9a3412", letterSpacing: 0.5, marginBottom: 4,
                }}>
                  NEW BOOKINGS BLOCKED — {pendingStatsCount} STATS PENDING
                </div>
                <div style={{ fontSize: 13, color: "#c2410c", lineHeight: 1.55 }}>
                  You have <strong>{pendingStatsCount}</strong> completed match(es) where you haven't submitted player stats yet.
                  Enter the stats below to unlock new booking requests.
                  Your trust score increases with every submission.
                </div>
              </div>
              <button
                onClick={() => setFilter("past")}
                style={{
                  background: "#ea580c", color: "#fff", border: "none",
                  borderRadius: 8, padding: "9px 18px", fontSize: 13,
                  fontWeight: 700, cursor: "pointer", flexShrink: 0,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                View Matches ↓
              </button>
            </div>
          </div>
        )}

        {/* ── NEW REQUEST BANNER ── */}
        {hasNewRequest && filter !== "pending" && (
          <div style={{ maxWidth: 1100, margin: "16px auto 0", padding: "0 2.5rem" }}>
            <div style={{
              background: "#fef3c7", border: "1.5px solid #fde68a",
              borderRadius: 10, padding: "12px 16px",
              fontSize: 13, color: "#92400e", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              🔔 New booking request received. Open the <strong>Pending</strong> tab to review it.
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        <div style={S.content}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                border: "3px solid #e8edf2", borderTopColor: "#f4b942",
                animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
              }} />
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#0a1628" }}>Loading Requests</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{
              background: "#fee2e2", border: "1.5px solid #fecaca",
              borderRadius: 12, padding: "20px 24px", color: "#991b1b", fontSize: 14,
            }}>{error}</div>
          )}

          {/* Empty */}
          {!loading && !error && requests.length === 0 && (
            <div style={{ textAlign: "center", padding: "72px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>📋</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#0a1628", marginBottom: 8 }}>
                No {filter === "all" ? "" : filter} requests
              </div>
              <p style={{ fontSize: 14, color: "#607080" }}>
                {filter === "pending"
                  ? "No pending requests right now. Check back later."
                  : "No bookings match this filter. Try a different tab."}
              </p>
             
            </div>
          )}

          {/* Booking cards */}
          {!loading && !error && requests.map((req) => {
            const sc    = STATUS_MAP[req.status] || STATUS_MAP.pending;
            const isRes = respondingId === req.id || respondingId === req._id;
            const actMsg = actionMsg.id === req._id ? actionMsg : null;

            return (
              <div key={req._id} style={S.card}>

                {/* Top row */}
                <div style={{ ...S.cardTop }} className="card-top">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                      }}>{sc.label}</span>
                      {isUpcoming(req) && req.status !== "pending" && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#dbeafe", color: "#1e40af" }}>Upcoming</span>
                      )}
                      {isPast(req) && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>Completed</span>
                      )}
                    </div>
                    <div style={S.eventName}>{req.eventName}</div>
                    <div style={S.partyLine}>
                      {isOwner ? "Booking for" : "Request from"}{" "}
                      <span style={S.partyHighlight}>
                        {isOwner ? req.playerName : req.ownerName}
                      </span>
                    </div>
                  </div>

                  {/* Fee highlight */}
                  <div style={{
                    textAlign: "right", flexShrink: 0,
                    background: "#f8fafc", border: "1.5px solid #e8edf2",
                    borderRadius: 12, padding: "12px 18px",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Offered Fee</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#0a1628" }}>₹{req.fee }</div>
                  </div>
                </div>

                {/* Meta grid */}
                <div style={S.metaGrid} className="meta-grid">
                  {[
                    { label: "Event Date",    val: fmtDate(req.eventDate) },
                    { label: "Location",      val: req.eventLocation || "TBD" },
                    { label: "Event Type",    val: req.eventType || "Match" },
                    { label: "Requested On",  val: fmtDate(req.createdAt) },
                  ].map(({ label, val }) => (
                    <div key={label} style={S.metaBox}>
                      <div style={S.metaLabel}>{label}</div>
                      <div style={S.metaVal}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Messages */}
                {req.message && (
                  <div style={S.msgBox}>
                    <div style={S.msgLabel}>Message from {isOwner ? "Owner" : req.ownerName}</div>
                    <p style={S.msgText}>{req.message}</p>
                  </div>
                )}
                {req.playerResponse && (
                  <div style={{ ...S.msgBox, background: "#f0fdf4", borderColor: "#a7f3d0" }}>
                    <div style={{ ...S.msgLabel, color: "#065f46" }}>Your Response</div>
                    <p style={{ ...S.msgText, color: "#065f46" }}>{req.playerResponse}</p>
                  </div>
                )}

                {/* Inline action message */}
                {actMsg && (
                  <div style={{
                    marginTop: 10, padding: "10px 14px", borderRadius: 8, fontSize: 13,
                    background: actMsg.ok ? "#d1fae5" : "#fee2e2",
                    color: actMsg.ok ? "#065f46" : "#991b1b",
                    border: `1.5px solid ${actMsg.ok ? "#a7f3d0" : "#fecaca"}`,
                  }}>{actMsg.text}</div>
                )}

                {/* Actions */}
                <div style={S.actionRow} className="action-row">
                  <button
                    style={S.btnGhost}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    onClick={() => navigate(`/PlayerProfile/${req.playerId}`)}
                  >
                    👤 View Player Profile
                  </button>

                  {req.status === "accepted" && (
  <button style={S.btnNavy} onClick={() => navigate("/messages")}>
    💬 Message {isOwner ? req.playerName : req.ownerName}
  </button>
)}
{req.status === "accepted" && isOwner && (
  <RateBookingButton booking={req} />
)}
{req.status === "accepted" && !isOwner && (
  <ReminderButton booking={req} />
)}
{req.status === "accepted" && !isOwner && !isPast(req) && (
  <button
    style={S.btnRed}
    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
    onClick={() => setCancelingId(req._id)}
  >
    ✕ Cancel Booking
  </button>
)}

                  {/* ── Enter Match Stats button (owner, past event, not yet submitted) ── */}
                  {req.status === "accepted" && isOwner && isPast(req) && !req.statsSubmitted && (
                    <button
                      style={{
                        ...S.btnGold,
                        background: "#f97316", color: "#fff",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      onClick={() => setStatsModal(req)}
                    >
                      🏏 Enter Match Stats
                    </button>
                  )}

                  {/* ── Stats already submitted badge ── */}
                  {req.status === "accepted" && isOwner && isPast(req) && req.statsSubmitted && (
                    <div style={{
                      padding: "10px 16px", borderRadius: 8, fontSize: 13,
                      background: "#d1fae5", border: "1.5px solid #a7f3d0",
                      color: "#065f46", fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      ✅ Stats Submitted
                    </div>
                  )}

                  {req.status === "pending" && !isOwner && !isRes && (
                    <button style={S.btnGold}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      onClick={() => setRespondingId(req._id)}>
                      Respond to Request
                    </button>
                  )}

                  {req.status === "pending" && !isOwner && isRes && (
                    <div style={{ ...S.respondBox, width: "100%" }}>
                      <p style={{ ...S.metaLabel, marginBottom: 10 }}>Your Response</p>
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Write your response here…"
                        rows={4}
                        style={S.textarea}
                        onFocus={(e) => e.target.style.borderColor = "#f4b942"}
                        onBlur={(e) => e.target.style.borderColor = "#e8edf2"}
                      />
                      <div style={{ ...S.actionRow, marginTop: 12 }} className="action-row">
                        <button style={S.btnGreen}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          onClick={() => handleAccept(req._id)}>
                          ✓ Accept Booking
                        </button>
                        <button style={S.btnRed}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          onClick={() => handleReject(req._id)}>
                          ✕ Reject Booking
                        </button>
                        <button style={S.btnGhost}
                          onClick={() => { setRespondingId(null); setResponseMessage(""); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {cancelingId === req._id && req.status === "accepted" && !isOwner && (
                    <div style={{ ...S.respondBox, width: "100%" }}>
                      <p style={{ ...S.metaLabel, marginBottom: 10 }}>
                        This will cancel the accepted booking and notify the owner. Please explain why you are rejecting it.
                      </p>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation..."
                        rows={4}
                        style={S.textarea}
                      />
                      <div style={{ ...S.actionRow, marginTop: 12 }} className="action-row">
                        <button style={S.btnRed}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          onClick={() => handlePlayerCancel(req._id)}>
                          Confirm Cancel Booking
                        </button>
                        <button style={S.btnGhost}
                          onClick={() => { setCancelingId(null); setCancelReason(""); }}>
                          Abort
                        </button>
                      </div>
                    </div>
                  )}
                  {req.status === "pending" && isOwner && (
                    <>
                      <div style={{ ...S.metaBox, fontSize: 13, color: "#92400e" }}>
                        ⏳ Waiting for {req.playerName} to respond.
                      </div>
                      <button
                        style={S.btnRed}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        onClick={() => handleCancel(req._id)}
                      >
                        ✕ Cancel Request
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}