import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import BookingModal from "../components/BookingModal";
import TournamentInviteButton from "../components/TournamentInviteButton";

// Google Fonts
const fontLink = document.createElement("link");
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector(`link[href="${fontLink.href}"]`))
  document.head.appendChild(fontLink);

// ── Helpers ───────────────────────────────────────────────────────────────────
const roleCardBg = {
  Batsman:        "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  Bowler:         "linear-gradient(135deg,#d1fae5,#a7f3d0)",
  "All-Rounder":  "linear-gradient(135deg,#fef3c7,#fde68a)",
  "All Rounder":  "linear-gradient(135deg,#fef3c7,#fde68a)",
  "Wicket Keeper":"linear-gradient(135deg,#ede9fe,#ddd6fe)",
};
const roleEmoji = {
  Batsman: "🏏", Bowler: "🎯",
  "All-Rounder": "⚡", "All Rounder": "⚡", "Wicket Keeper": "🧤",
};
const roleBadge = {
  Batsman: "⭐ Top Rated", Bowler: "🔥 In Demand",
  "All-Rounder": "✅ Verified", "All Rounder": "✅ Verified", "Wicket Keeper": "🌟 Elite",
};

// ── Inline star display — reads real avg from player object ───────────────────
// Expects player to have: player.avgStars (number) and player.totalRatings (number)
// These are fetched in bulk alongside the player list (see useEffect below).
// Falls back gracefully to empty stars if not yet loaded.
function CardStarRating({ avgStars = 0, totalRatings = 0 }) {
  const filled = Math.floor(avgStars);
  const half   = avgStars % 1 >= 0.5;
  const empty  = 5 - filled - (half ? 1 : 0);

  return (
    <div className="flex justify-center items-center gap-1 mt-1 mb-1">
      <span style={{ color: "#f4b942", fontSize: 14, letterSpacing: 1 }}>
        {"★".repeat(filled)}
        {half ? "⯨" : ""}
        <span style={{ color: "#d1d5db" }}>{"☆".repeat(empty)}</span>
      </span>
      {totalRatings > 0 ? (
        <span style={{ color: "#9ca3af", fontSize: 11 }}>
          {avgStars.toFixed(1)}
          <span style={{ color: "#d1d5db", marginLeft: 2 }}>({totalRatings})</span>
        </span>
      ) : (
        <span style={{ color: "#d1d5db", fontSize: 11 }}>No ratings</span>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-lg text-sm border border-[#e8edf2] bg-[#f8fafc] text-[#0a1628] outline-none focus:border-[#f4b942] transition-colors";

// ─────────────────────────────────────────────────────────────────────────────
export default function FindPlayer() {
  const [search, setSearch]           = useState("");
  const [date, setDate]               = useState("");
  const [role, setRole]               = useState("All");
  const [searchCity, setSearchCity]   = useState("");
  const [players, setPlayers]         = useState([]);
  // Map of playerId → { avgStars, totalRatings }
  const [ratingsMap, setRatingsMap]   = useState({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer]     = useState(null);
  const navigate = useNavigate();

  const token           = localStorage.getItem("token");
  const currentUserId   = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const currentUserCity = localStorage.getItem("userCity") || "";

  useEffect(() => {
    setSearchCity(currentUserCity);
    setDate(new Date().toISOString().split("T")[0]);

    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_URL}/players/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.data.success) {
          setError(res.data.message || "Failed to fetch players");
          return;
        }
        const list = res.data.data || [];
        setPlayers(list);

        // Fetch real ratings for every player in parallel
        // Each call hits GET /ratings/player/:id → { averageStars, totalRatings }
        const ratingResults = await Promise.allSettled(
          list.map((p) =>
            axios.get(`${API_URL}/ratings/player/${p._id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
          )
        );
        const map = {};
        ratingResults.forEach((result, idx) => {
          const pid = list[idx]._id;
          if (result.status === "fulfilled" && result.value.data.success) {
            map[pid] = {
              avgStars:     result.value.data.averageStars  || 0,
              totalRatings: result.value.data.totalRatings  || 0,
            };
          } else {
            map[pid] = { avgStars: 0, totalRatings: 0 };
          }
        });
        setRatingsMap(map);
      } catch (e) {
        setError(e.response?.data?.message || "Error loading players.");
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [currentUserCity]);

  const filteredPlayers = players.filter((p) => {
    if (currentUserId && p._id === currentUserId) return false;
    const todayObj        = new Date(new Date().toISOString().split("T")[0]);
    const selectedDateObj = date ? new Date(date) : null;
    const daysDiff        = selectedDateObj ? Math.floor((selectedDateObj - todayObj) / 86400000) : -1;
    const isAvailableOnDate = daysDiff >= 0 && p.availability && p.availability[daysDiff];
    const isAvailable   = p.status?.toLowerCase() === "available" || isAvailableOnDate;
    const cityMatch     = !searchCity || p.city?.toLowerCase().includes(searchCity.toLowerCase());
    const roleMatch     = role === "All" || p.role === role || p.role?.includes(role.replace(/[🏏🎯🔥]/g, "").trim());
    return p.name?.toLowerCase().includes(search.toLowerCase()) && roleMatch && cityMatch && isAvailable;
  });

  const handleBookNow = (player) => {
    if (!currentUserId) { alert("Please login first to book a player"); navigate("/Log_SignUp"); return; }
    setSelectedPlayer(player);
    setShowBookingModal(true);
  };

  const availablePlayers = players.filter(
    (p) => p._id !== currentUserId && (p.status?.toLowerCase() === "available" || p.availability?.[0])
  );

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="min-h-screen bg-[#f4f7fb] text-[#0a1628] pt-20" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── HERO ── */}
        <section className="px-4 sm:px-10 pt-12 pb-14 text-center"
          style={{ background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 55%,#0f2d1e 100%)" }}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-5 text-xs font-semibold uppercase tracking-widest text-[#f4b942] rounded-full"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
            🏏 Find Your Perfect Player
          </div>
          <h1 className="text-white leading-none mb-3 tracking-wider"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px,6vw,60px)" }}>
            TOP CRICKETERS<br />
            <span className="text-[#f4b942]">AVAILABLE NOW</span>
          </h1>
          <p className="text-white/65 text-sm sm:text-base max-w-md mx-auto">
            Browse verified players by role, city, and availability. Book instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-10 mt-8">
            {[
              { num: players.length,          label: "Total Players" },
              { num: availablePlayers.length,  label: "Available Now" },
              { num: filteredPlayers.length,   label: "Matching Filters" },
            ].map(({ num, label }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div className="hidden sm:block w-px h-9 bg-white/15 self-center" />}
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl text-[#f4b942] leading-none"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{num}</div>
                  <div className="text-xs text-white/50 mt-1">{label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── FILTER BAR ── */}
        <div className="bg-white sticky top-16 z-10 px-4 sm:px-10 py-5"
          style={{ borderBottom: "1.5px solid #e8edf2", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
            <input type="text" placeholder="Search player name…" value={search}
              onChange={(e) => setSearch(e.target.value)} className={inputCls} />
            <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputCls} cursor-pointer`}>
              <option value="All">All Roles</option>
              <option value="Batsman">🏏 Batsman</option>
              <option value="Bowler">🎯 Bowler</option>
              <option value="All-Rounder">⚡ All-Rounder</option>
              <option value="Wicket Keeper">🧤 Wicket Keeper</option>
            </select>
            <input type="text" placeholder="Search city…" value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)} className={inputCls} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            <button className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#0a1628] text-white hover:bg-[#1a3a5c] transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="max-w-5xl mx-auto px-4 sm:px-10 pt-6">
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="max-w-5xl mx-auto px-4 sm:px-10 py-20 text-center">
            <div className="w-12 h-12 rounded-full border-[3px] border-[#e8edf2] mx-auto mb-4"
              style={{ borderTopColor: "#f4b942", animation: "spin 0.8s linear infinite" }} />
            <p className="text-2xl text-[#0a1628] mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Loading Players</p>
            <p className="text-sm text-[#607080]">Fetching the latest player data…</p>
          </div>
        )}

        {/* ── RESULTS HEADER ── */}
        {!loading && !error && (
          <div className="max-w-5xl mx-auto px-4 sm:px-10 mt-7 mb-5 flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="inline-block bg-[#e8f5e9] text-[#1b5e20] text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                Featured Players
              </span>
              <div className="text-3xl text-[#0a1628] mt-1.5" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {filteredPlayers.length} Player{filteredPlayers.length !== 1 ? "s" : ""} Found
              </div>
            </div>
            <div className="text-sm text-[#607080]">Showing available players · {date}</div>
          </div>
        )}

        {/* ── PLAYER CARDS ── */}
        {!loading && !error && (
          filteredPlayers.length > 0 ? (
            <div className="max-w-8xl mx-auto px-4 sm:px-10 pb-20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredPlayers.map((player, i) => {
                const pRole   = player.role || "Batsman";
                const bg      = roleCardBg[pRole] || "linear-gradient(135deg,#f0f4ff,#e0e7ff)";
                const emoji   = roleEmoji[pRole]  || "🏏";
                const badge   = roleBadge[pRole]  || "⭐ Top Rated";
                const isAvail = player.status?.toLowerCase() === "available" || player.availability?.[0];

                // Real rating from DB, loaded in parallel during initial fetch
                const { avgStars = 0, totalRatings = 0 } = ratingsMap[player._id] || {};

                return (
                  <div
                    key={player._id || i}
                    className="bg-white rounded-2xl overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                    style={{ border: "1.5px solid #e8edf2" }}
                    onClick={() => navigate(`/PlayerProfile/${player._id}`)}
                  >
                    {/* Card header */}
                    <div className="h-24 flex items-center justify-center relative" style={{ background: bg }}>
                      {player.photo ? (
                        <img
                          src={`${API_URL}/uploads/${player.photo}`}
                          alt={player.name}
                          className="w-16 h-16 rounded-full object-cover"
                          style={{ border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full bg-[#0a1628] text-[#f4b942] flex items-center justify-center text-2xl"
                          style={{ fontFamily: "'Bebas Neue', sans-serif", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
                        >
                          {player.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <span
                        className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full"
                        style={{ background: isAvail ? "#10b981" : "#94a3b8", border: "2px solid #fff" }}
                        title={isAvail ? "Available" : "Not Available"}
                      />
                    </div>

                    {/* Card body */}
                    <div className="p-4 flex flex-col items-center">
                      <div className="font-semibold text-sm text-[#0a1628] truncate w-full text-center">
                        {player.name}
                      </div>
                      <div className="text-xs text-[#607080] mt-0.5">{player.role || "Player"}</div>
                      {player.city && (
                        <div className="text-xs text-[#607080] mt-1">{player.city}</div>
                      )}

                      {/* Stats */}
                      <div className="flex justify-center items-center gap-5 my-2.5">
                        {[
                          { v: player.stats?.runs    || 0, k: "RUNS"    },
                          { v: player.stats?.wickets || 0, k: "WKTS"    },
                          { v: player.stats?.matches || 0, k: "MATCHES" },
                        ].map(({ v, k }) => (
                          <div key={k} className="text-center">
                            <div className="text-lg leading-none text-[#0a1628]"
                              style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{v}</div>
                            <div className="text-[10px] text-[#9ca3af] tracking-wide">{k}</div>
                          </div>
                        ))}
                      </div>

                      {/* ── REAL STAR RATING — below stats ── */}
                      <CardStarRating avgStars={avgStars} totalRatings={totalRatings} />

                      <div className="flex justify-center mt-2 text-[11px] items-center font-semibold px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#1b5e20]">
                        {badge}
                      </div>

                      <div className={`flex justify-center items-center mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isAvail ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#f1f5f9] text-[#64748b]"
                      }`}>
                        {isAvail ? "✓ Available" : "Unavailable"}
                      </div>

                      {player.fee && (
                        <div className="text-sm font-semibold text-[#059669] mt-1.5">
                          ₹{player.fee}/match
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-2 w-full pt-3 pb-1">
                        <button
                          className="flex-1 py-2 px-2 rounded-lg text-xs font-semibold bg-[#f4b942] text-[#0a1628] hover:opacity-85 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); navigate(`/PlayerProfile/${player._id}`); }}
                        >
                          View
                        </button>
                        <button
                          className="flex-1 py-2 px-2 rounded-lg text-xs font-semibold bg-[#0a1628] text-white hover:opacity-85 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleBookNow(player); }}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── EMPTY STATE ── */
            <div className="max-w-5xl mx-auto px-4 sm:px-10 py-20 text-center">
              <div className="text-5xl mb-3">🏏</div>
              <div className="text-3xl text-[#0a1628] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                No Players Found
              </div>
              <p className="text-sm text-[#607080] mb-6">
                No players match your current filters. Try adjusting the role, city, or date.
              </p>
              <button
                className="px-8 py-3 rounded-xl text-sm font-semibold bg-[#0a1628] text-white hover:bg-[#1a3a5c] transition-colors"
                onClick={() => { setSearch(""); setRole("All"); setSearchCity(""); }}
              >
                Clear Filters
              </button>
            </div>
          )
        )}

        {/* ── BOOKING MODAL ── */}
        {showBookingModal && selectedPlayer && (
          <BookingModal
            playerId={selectedPlayer._id}
            playerName={selectedPlayer.name}
            playerFee={selectedPlayer.fee}
            date={date}
            onClose={() => { setShowBookingModal(false); setSelectedPlayer(null); }}
            onSuccess={() => { setShowBookingModal(false); setSelectedPlayer(null); }}
            ownerId={currentUserId}
            ownerName={currentUserName}
            ownerCity={currentUserCity}
          />
        )}
      </div>
    </>
  );
}