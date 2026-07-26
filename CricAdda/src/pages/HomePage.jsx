import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import { toast } from "react-toastify";

// ── Google Fonts ──────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector(`link[href="${fontLink.href}"]`))
  document.head.appendChild(fontLink);

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPlayerRating = (stats) => {
  if (!stats) return 0;
  const matches  = Number(stats.matches)  || 0;
  const runs     = Number(stats.runs)     || 0;
  const wickets  = Number(stats.wickets)  || 0;
  if (matches === 0) return 0;
  const score =
    Math.min(runs / matches / 30, 1) * 0.5 +
    Math.min(wickets / matches / 2, 1) * 0.35 +
    Math.min(matches / 40, 1) * 0.15;
  return Math.round(score * 5 * 10) / 10;
};

const roleCardBg = {
  Batsman:         "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  Bowler:          "linear-gradient(135deg,#d1fae5,#a7f3d0)",
  "All-Rounder":   "linear-gradient(135deg,#fef3c7,#fde68a)",
  "Wicket Keeper": "linear-gradient(135deg,#ede9fe,#ddd6fe)",
};
const roleEmoji  = { Batsman: "🏏", Bowler: "🎯", "All-Rounder": "⚡", "Wicket Keeper": "🧤" };
const roleBadge  = { Batsman: "⭐ Top Rated", Bowler: "🔥 In Demand", "All-Rounder": "✅ Verified", "Wicket Keeper": "🌟 Elite" };
const tBgColors  = ["#fef3c7", "#d1fae5", "#ede9fe"];
const tEmojis    = ["🏆", "🎖️", "⚡"];

// ── Star renderer ─────────────────────────────────────────────────────────────
const StarRating = ({ rating }) => {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="text-[#f4b942] text-sm tracking-wide">
      {[1, 2, 3, 4, 5].map((i) =>
        rounded >= i ? "★" : rounded + 0.5 === i ? "⯪" : "☆"
      ).join("")}
      <span className="text-[#607080] text-xs ml-1">{rating.toFixed(1)}</span>
    </span>
  );
};

// ── Hero stat box ─────────────────────────────────────────────────────────────
const StatBox = ({ num, label }) => (
  <div className="text-center">
    <div className="text-4xl sm:text-5xl text-[#f4b942] leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
      {num}
    </div>
    <div className="text-sm text-white/55 mt-1">{label}</div>
  </div>
);

const Divider = () => (
  <div className="hidden sm:block w-px h-12 bg-white/15 self-center" />
);

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [players, setPlayers]             = useState([]);
  const [tournaments, setTournaments]     = useState([]);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerError, setPlayerError]     = useState(null);
  const [roleFilter, setRoleFilter]       = useState("All");
  const [hasNotification, setHasNotification] = useState(false);
  const navigate = useNavigate();

  const token    = localStorage.getItem("token");
  const userRaw  = localStorage.getItem("user");
  const user     = userRaw ? JSON.parse(userRaw) : null;
  const userId   = user?._id || user?.id || localStorage.getItem("userId");
  const userType = user?.userType || localStorage.getItem("userType") || "Player";
  const isLoggedIn   = !!token;

  // Fetch players
  useEffect(() => {
    const fetchPlayers = async () => {
      setPlayerLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/players/all`, { headers });
        setPlayers(res.data.data || []);
      } catch (e) {
        const msg = e.response?.data?.message || "Unable to load players.";
        setPlayerError(msg);
        toast.error("⚠️ " + msg, { toastId: "player-fetch-error" });
      } finally {
        setPlayerLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  // Fetch tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await axios.get(`${API_URL}/tournaments`, {
          params: { status: "upcoming" },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setTournaments((res.data.tournaments || []).slice(0, 3));
      } catch (_) {}
    };
    fetchTournaments();
  }, []);

  // Check notifications — toast once per session when there are new pending bookings
  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    const check = async () => {
      try {
        const headers         = { Authorization: `Bearer ${token}` };
        const bookingEndpoint = userType === "Owner"
          ? `${API_URL}/bookings/owner/${userId}`
          : `${API_URL}/bookings/player/${userId}/all`;
        const [bookingRes, convoRes] = await Promise.all([
          axios.get(bookingEndpoint, { headers }),
          axios.get(`${API_URL}/messages/conversations/${userId}`, { headers }),
        ]);
        const bookingItems = bookingRes.data.requests || bookingRes.data.bookings || [];
        const pendingCount = bookingItems.filter((b) => b.status === "pending").length;
        const seenTimes    = JSON.parse(localStorage.getItem("conversationSeenTimes") || "{}");
        const unreadConvos = (convoRes.data.data || []).filter((conv) => {
          if (!conv.lastMessageTime) return false;
          return new Date(conv.lastMessageTime).getTime() > (seenTimes[conv.bookingId] || 0);
        });

        const hasPending = pendingCount > 0;
        const hasUnread  = unreadConvos.length > 0;
        setHasNotification(hasPending || hasUnread);

        // Show toasts only once per page load (use toastId to prevent duplicates)
        if (hasPending) {
          toast.info(
            `📩 You have ${pendingCount} pending booking ${pendingCount === 1 ? "request" : "requests"}`,
            { toastId: "pending-bookings", onClick: () => navigate("/BookingRequests") }
          );
        }
        if (hasUnread) {
          toast.info(
            `💬 ${unreadConvos.length} unread ${unreadConvos.length === 1 ? "message" : "messages"}`,
            { toastId: "unread-messages", onClick: () => navigate("/messages") }
          );
        }
      } catch (_) {}
    };
    check();
    // Repeat every 30s but don't re-toast (toastId deduplicates)
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userId]);

  // Derived
  const availablePlayers = players.filter(
    (p) => p.status?.toLowerCase() === "available" || p.availability?.[0]
  );
  const topPlayers = [...players]
    .sort((a, b) => getPlayerRating(b.stats) - getPlayerRating(a.stats))
    .slice(0, 5);
  const filteredPlayers = roleFilter === "All"
    ? topPlayers
    : topPlayers.filter((p) => p.role === roleFilter);
  const avgRating = players.length
    ? (players.reduce((s, p) => s + getPlayerRating(p.stats), 0) / players.length).toFixed(1)
    : "0.0";
  const roleCounts = players.reduce(
    (acc, p) => { const r = p.role || "Other"; acc[r] = (acc[r] || 0) + 1; return acc; },
    { Batsman: 0, Bowler: 0, "All-Rounder": 0 }
  );
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

  // ── Handlers with toasts ──────────────────────────────────────────────────
  const handleHireNow = (player, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.warning("🔒 Please log in to hire a player!", {
        onClick: () => navigate("/Log_SignUp"),
      });
      return;
    }
    navigate(`/PlayerProfile/${player._id}`);
  };

  const handleTournamentAction = (status, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.warning("🔒 Please log in to register for tournaments!", {
        onClick: () => navigate("/Log_SignUp"),
      });
      return;
    }
    navigate("/Tournaments");
  };

  const handleLogOut = () => {
    toast.success("👋 Logged out successfully. See you soon!", { autoClose: 2000 });
    setTimeout(() => { localStorage.clear(); window.location.href = "/"; }, 1500);
  };

  const handleSocialClick = () => {
    toast.info("🚀 Social links coming soon!", { autoClose: 2000 });
  };

  // ── Shared button classes ────────────────────────────────────────────────────
  const btnPrimary   = "inline-block bg-[#f4b942] text-[#0a1628] font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity no-underline" ;
  const btnSecondary = "inline-block bg-transparent text-white font-semibold px-8 py-3.5 rounded-xl text-base border border-white/50 hover:bg-white/10 transition-colors no-underline";

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#0a1628]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden text-center px-6 pt-28 pb-20 md:pt-25 md:pb-24"
        style={{ background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 50%,#0f2d1e 100%)" }}
      >
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-semibold tracking-widest uppercase text-[#f4b942] rounded-full"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          🏏 India's #1 Cricket Hiring Platform
        </div>

        <h1
          className="text-white leading-none mb-5 tracking-wider"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(42px,8vw,72px)" }}
        >
          FIND YOUR <span className="text-[#f4b942]">NEXT</span>
          <br />CRICKET STAR
        </h1>

        <p className="max-w-xl mx-auto mb-9 text-base md:text-lg text-white/70 leading-relaxed">
          Connect with elite cricket players across India. Build your team, win tournaments,
          and take your game to the next level.
        </p>

        <div className="flex flex-wrap  justify-center gap-4">
          <Link
            to="/FindPlayers"
            className="inline-block  text-[#0a1628] font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity no-underline" style={{ background:"#f4b942"}}
            onClick={() => toast.success("🔍 Browsing available players…", { autoClose: 1500, toastId: "browse" })}
          >
            Browse Players
          </Link>
          {isLoggedIn
            ? <Link to="/Tournaments" className={btnSecondary}>View Tournaments</Link>
            : (
              <Link
                to="/Log_SignUp"
                className={btnSecondary}
                onClick={() => toast.info("📝 Create your free account!", { autoClose: 1500, toastId: "signup-cta" })}
              >
                Post a Requirement
              </Link>
            )
          }
        </div>

        {/* Hero stats */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mt-14">
          <StatBox num={`${players.length}+`}          label="Registered Players" />
          <Divider />
          <StatBox num={`${availablePlayers.length}+`} label="Available Now" />
          <Divider />
          <StatBox num={`${tournaments.length}+`}      label="Tournaments Listed" />
          <Divider />
          <StatBox num={avgRating}                      label="Avg. Player Rating" />
        </div>
      </section>

      {/* ── FEATURED PLAYERS ── */}
      <section className="px-4 sm:px-10 py-16 sm:py-20">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-9">
          <div>
            <span className="inline-block bg-[#e8f5e9] text-[#1b5e20] text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              Featured Players
            </span>
            <div className="text-4xl text-[#0a1628]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Top Cricketers Available
            </div>
            <p className="text-[#607080] text-sm mt-1 max-w-sm leading-relaxed">
              Browse verified players ready for your next match or tournament.
            </p>
          </div>
          {/* Role filter chips */}
          <div className="flex flex-wrap gap-2">
            {["All", "Batsman", "Bowler", "All-Rounder", "Wicket Keeper"].map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRoleFilter(r);
                  toast.success(
                    r === "All" ? "📋 Showing all players" : `${roleEmoji[r] || "🏏"} Filtering ${r}s`,
                    { autoClose: 1200, toastId: `filter-${r}` }
                  );
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  roleFilter === r
                    ? "bg-[#f4b942] text-[#0a1628] border border-[#f4b942]"
                    : "bg-white text-[#607080] border border-[#e8edf2] hover:border-[#f4b942]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {playerLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-[#e8edf2] animate-pulse" />
            ))}
          </div>
        ) : playerError ? (
          <p className="text-red-500 text-center py-10">{playerError}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {filteredPlayers.map((player, i) => {
              const role   = player.role || "Batsman";
              const bg     = roleCardBg[role] || "linear-gradient(135deg,#f0f4ff,#e0e7ff)";
              const emoji  = roleEmoji[role]  || "🏏";
              const badge  = roleBadge[role]  || "⭐ Top Rated";
              const rating = getPlayerRating(player.stats);
              return (
                <div
                  key={player._id || i}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                  style={{ border: "1.5px solid #e8edf2" }}
                  onClick={() => navigate(`/PlayerProfile/${player._id}`)}
                >
                  {/* Card header */}
                  <div
                    className="h-24 flex items-center justify-center text-4xl"
                    style={{ background: bg }}
                  >
                    {player.photo
                      ? <img src={`${API_URL}/uploads/${player.photo}`} alt={player.name} className="w-14 h-14 rounded-full object-cover" />
                      : emoji
                    }
                  </div>
                  {/* Card body */}
                  <div className="p-4">
                    <div className="font-semibold text-sm text-[#0a1628] truncate">{player.name}</div>
                    <div className="text-xs text-[#607080] mt-0.5">{player.role} · {player.city}</div>
                    {/* Mini stats */}
                    <div className="flex gap-3 my-3">
                      {[
                        { v: player.stats?.runs    || 0, k: "RUNS"    },
                        { v: player.stats?.wickets || 0, k: "WKTS"    },
                        { v: player.stats?.matches || 0, k: "MATCHES" },
                      ].map(({ v, k }) => (
                        <div key={k}>
                          <div className="text-xl leading-none text-[#0a1628]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{v}</div>
                          <div className="text-[10px] text-[#607080] tracking-wide">{k}</div>
                        </div>
                      ))}
                    </div>
                    <StarRating rating={rating} />
                    <div className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#1b5e20]">
                      {badge}
                    </div>
                    <button
                      className="w-full mt-2.5 bg-[#f4b942] text-[#0a1628] font-semibold text-sm py-2 rounded-lg hover:opacity-85 transition-opacity"
                      onClick={(e) => handleHireNow(player, e)}
                    >
                      Hire Now
                    </button>
                  </div>
                </div>
              );
            })}

            {/* View All card */}
            <div
              className="bg-white rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:-translate-y-1 transition-all min-h-[280px]"
              style={{ border: "2px dashed #e8edf2" }}
              onClick={() => navigate("/FindPlayers")}
            >
              <div className="text-4xl">👀</div>
              <div className="font-semibold text-[#0a1628] text-sm">View All Players</div>
              <button
                className="bg-[#f4b942] text-[#0a1628] font-semibold text-sm px-5 py-2 rounded-lg hover:opacity-85 transition-opacity"
                onClick={(e) => { e.stopPropagation(); navigate("/FindPlayers"); }}
              >
                Browse All
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-4 sm:px-10 py-16 sm:py-20 bg-[#eaf2ff]">
        <div className="text-center mb-10">
          <span className="inline-block bg-[#e8f5e9] text-[#1b5e20] text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            How It Works
          </span>
          <div className="text-4xl text-[#0a1628]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Simple. Fast. Effective.
          </div>
          <p className="text-[#607080] text-sm mt-1 max-w-sm mx-auto leading-relaxed">
            Get your perfect cricket player in 4 easy steps.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 max-w-5xl mx-auto">
          {[
            { n: "01", title: "Create Your Profile",  desc: "Sign up as a team manager or a player. Set your preferences, location, and playing format." },
            { n: "02", title: "Search & Filter",      desc: "Browse players by role, batting/bowling style, city, availability and performance stats." },
            { n: "03", title: "Send a Request",       desc: "Send a hiring request with match details, venue, and compensation. Players can accept or counter-offer." },
            { n: "04", title: "Play & Rate",           desc: "Play together and leave ratings. Build your reputation. The best players rise to the top." },
          ].map((s) => (
            <div key={s.n} className="bg-white rounded-2xl p-7" style={{ border: "1.5px solid #e8edf2" }}>
              <div
                className="w-12 h-12 rounded-xl bg-[#0a1628] text-[#f4b942] flex items-center justify-center mb-5 text-2xl"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {s.n}
              </div>
              <div className="font-semibold text-base text-[#0a1628] mb-2">{s.title}</div>
              <p className="text-sm text-[#607080] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOURNAMENTS ── */}
      

      {/* ── ROLE BREAKDOWN ── */}
      <section className="px-4 sm:px-10 py-16 sm:py-20 bg-[#eaf2ff]">
        <div className="text-center mb-9">
          
          <div className="text-4xl text-[#0a1628]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Player Role Breakdown
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-3xl mx-auto">
          {[
            { role: "Batsman",     emoji: "🏏", color: "#dbeafe" },
            { role: "Bowler",      emoji: "🎯", color: "#d1fae5" },
            { role: "All-Rounder", emoji: "⚡", color: "#fef3c7" },
            { role: "Available",   emoji: "✅", color: "#ede9fe", count: availablePlayers.length },
          ].map(({ role, emoji, color, count }) => (
            <div
              key={role}
              className="bg-white rounded-2xl p-6 text-center cursor-pointer hover:-translate-y-0.5 transition-all"
              style={{ border: "1.5px solid #e8edf2" }}
              onClick={() => {
                if (role !== "Available") {
                  setRoleFilter(role);
                  toast.success(`${emoji} Showing ${role}s`, { autoClose: 1200, toastId: `stat-${role}` });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3"
                style={{ background: color }}
              >
                {emoji}
              </div>
              <div className="text-3xl text-[#0a1628] leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {count !== undefined ? count : (roleCounts[role] || 0)}
              </div>
              <div className="text-sm text-[#607080] mt-1">{role}s</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="px-4 sm:px-10 py-20 text-center"
        style={{ background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 50%,#0f2d1e 100%)" }}
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-semibold tracking-widest uppercase text-[#f4b942] rounded-full"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          Join {players.length}+ Players &amp; Teams
        </div>
        <h2
          className="text-white mb-4 leading-none tracking-wide"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px,5vw,52px)" }}
        >
          READY TO PLAY?
        </h2>
        <p className="text-white/65 text-base max-w-md mx-auto mb-9 leading-relaxed">
          Whether you're a player looking for opportunities or a team hunting for talent — CricAdda connects you instantly.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/Log_SignUp"
            className={btnPrimary}
            onClick={() => toast.success("🏏 Welcome! Let's get you registered.", { autoClose: 1800, toastId: "cta-register" })}
          >
            Register as Player
          </Link>
          <Link
            to="/FindPlayers"
            className={btnSecondary}
            onClick={() => toast.info("🔍 Finding the best players for you…", { autoClose: 1500, toastId: "cta-hire" })}
          >
            Hire a Player
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a1628] px-4 sm:px-10 pt-12 pb-7">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="text-[22px] text-white mb-2.5" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              CRIC<span className="text-[#f4b942]">ADDA</span>
            </div>
            <p className="text-sm text-[#b0c4de] leading-relaxed max-w-xs">
              India's premier cricket player hiring platform. Connecting talent with opportunity across the country.
            </p>
          </div>
          {/* Platform */}
          <div>
            <div className="text-xs font-semibold text-white uppercase tracking-widest mb-3">Platform</div>
            {[
              { to: "/FindPlayers",      label: "Find Players"      },
              { to: "/Tournaments",      label: "Tournaments"       },
              { to: "/BookingRequests",  label: "Booking Requests"  },
              { to: "/messages",         label: "Messages"          },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="block text-sm text-[#b0c4de] mb-2 no-underline hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
          {/* Players */}
          <div>
            <div className="text-xs font-semibold text-white uppercase tracking-widest mb-3">Players</div>
            {[
              { to: "/Log_SignUp",    label: "Create Profile" },
              { to: "/Profile",       label: "Edit Profile"   },
              { to: "/how-it-works",  label: "How It Works"   },
              { to: "/FindPlayers",   label: "Browse All"     },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="block text-sm text-[#b0c4de] mb-2 no-underline hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
          {/* Account */}
          <div>
            <div className="text-xs font-semibold text-white uppercase tracking-widest mb-3">Account</div>
            {isLoggedIn ? (
              <>
                <Link to="/Profile"         className="block text-sm text-[#b0c4de] mb-2 no-underline hover:text-white transition-colors">My Profile</Link>
                <Link to="/BookingRequests" className="block text-sm text-[#b0c4de] mb-2 no-underline hover:text-white transition-colors">My Bookings</Link>
                <Link to="/messages"        className="block text-sm text-[#b0c4de] mb-2 no-underline hover:text-white transition-colors">
                  Messages {hasNotification && "🔴"}
                </Link>
                <span
                  className="block text-sm text-[#b0c4de] mb-2 cursor-pointer hover:text-white transition-colors"
                  onClick={handleLogOut}
                >
                  Log Out
                </span>
              </>
            ) : (
              <>
                <Link to="/Log_SignUp" className="block text-sm text-[#b0c4de] mb-2 no-underline hover:text-white transition-colors">Log In</Link>
                <Link to="/Log_SignUp" className="block text-sm text-[#b0c4de] mb-2 no-underline hover:text-white transition-colors">Sign Up</Link>
              </>
            )}
          </div>
        </div>

        {/* Footer bottom */}
        <div
          className="flex flex-wrap justify-between items-center gap-3 pt-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="text-xs text-[#b0c4de]">
            © 2026 CricAdda. All rights reserved. Made with 🏏 in India.
          </div>
          <div className="flex gap-2.5">
            {["𝕏", "📸", "▶", "💬"].map((icon, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-[#b0c4de] cursor-pointer transition-all hover:bg-[#f4b942] hover:text-[#0a1628]"
                style={{ background: "rgba(255,255,255,0.1)" }}
                onClick={handleSocialClick}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}