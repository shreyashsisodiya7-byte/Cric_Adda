import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";

const getPlayerRating = (stats) => {
  if (!stats) return 0;
  const matches = Number(stats.matches) || 0;
  const runs = Number(stats.runs) || 0;
  const wickets = Number(stats.wickets) || 0;

  if (matches === 0) return 0;

  const avgRuns = runs / matches;
  const avgWickets = wickets / matches;

  const runScore = Math.min(avgRuns / 30, 1);
  const wicketScore = Math.min(avgWickets / 2, 1);
  const matchScore = Math.min(matches / 40, 1);

  const score = runScore * 0.5 + wicketScore * 0.35 + matchScore * 0.15;
  return Math.round(score * 5 * 10) / 10;
};

const renderRatingStars = (rating) => {
  const rounded = Math.round(rating * 2) / 2;
  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    if (rounded >= i) {
      stars.push("★");
    } else if (rounded + 0.5 === i) {
      stars.push("⯪");
    } else {
      stars.push("☆");
    }
  }
  return stars.join("");
};

export default function HomePage() {
  const [hasHomeNotification, setHasHomeNotification] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerError, setPlayerError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}") || {};
    const userId = localStorage.getItem("userId");
    const userType = user.userType || localStorage.getItem("userType") || "Player";

    if (!userId) return;

    const checkNotifications = async () => {
      try {
        const token = localStorage.getItem("token");        
    const headers = token ? { Authorization: `Bearer ${token}` } : {};  
        const bookingEndpoint =
          userType === "Owner"
            ? `${API_URL}/bookings/owner/${userId}`
            : `${API_URL}/bookings/player/${userId}/all`;

        const [bookingRes, convoRes] = await Promise.all([
          axios.get(bookingEndpoint,{ headers }),
          axios.get(`${API_URL}/messages/conversations/${userId}`,{ headers }),
        ]);

        const bookingItems = bookingRes.data.requests || bookingRes.data.bookings || [];
        const hasPendingBooking = bookingItems.some((item) => item.status === "pending");

        const storedSeen = localStorage.getItem("conversationSeenTimes");
        const seenTimes = storedSeen ? JSON.parse(storedSeen) : {};
        const conversations = convoRes.data.data || [];
        const hasUnreadMessages = conversations.some((conv) => {
          if (!conv.lastMessage || !conv.lastMessageTime) return false;
          const lastTime = new Date(conv.lastMessageTime).getTime();
          const seenTime = seenTimes[conv.bookingId] || 0;
          return lastTime > seenTime;
        });

        setHasHomeNotification(hasPendingBooking || hasUnreadMessages);
      } catch (error) {
        console.error("Error checking homepage notifications:", error);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      setPlayerLoading(true);
      setPlayerError(null);
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/players/all`, { headers });
        setPlayers(res.data.data || []);
      } catch (error) {
        console.error("Error fetching players for homepage:", error);
        setPlayerError(
          error.response?.data?.message ||
          "Unable to load player details. Please login or try again later."
        );
      } finally {
        setPlayerLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const availablePlayers = players.filter(
    (player) =>
      player.status?.toLowerCase() === "available" ||
      (player.availability && player.availability[0])
  );

  const roleCounts = players.reduce(
    (counts, player) => {
      const role = player.role || "Other";
      counts[role] = (counts[role] || 0) + 1;
      return counts;
    },
    { Batsman: 0, Bowler: 0, "All-Rounder": 0, Other: 0 }
  );

  const cityCounts = Object.entries(
    players.reduce((counts, player) => {
      const city = player.city || "Unknown";
      counts[city] = (counts[city] || 0) + 1;
      return counts;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const averageRating = players.length
    ? (
      players.reduce((sum, player) => sum + getPlayerRating(player.stats), 0) /
      players.length
    ).toFixed(1)
    : "0.0";

  const topPlayers = [...players]
    .sort((a, b) => getPlayerRating(b.stats) - getPlayerRating(a.stats))
    .slice(0, 4);

  const currentCity = localStorage.getItem("userCity") || "Your area";
  const playersInCity = players.filter(
    (player) => player.city?.toLowerCase() === currentCity.toLowerCase()
  ).length;

  return (

    <div className="text-white overflow-hidden bg-linear-to-br from-[#0B1220] via-[#11182704] to-[#020617]">

      {/* HERO SECTION */}

      <section className="min-h-screen flex items-center px-6 md:px-24">

        <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center w-full">

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >

            <h1 className="text-xl md:text-7xl font-bold leading-relaxed">
              <span className="inline-block text-4xl md:text-6xl">Hire Local</span>
              <br />
              <span className="inline-block text-7xl   bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent pt-2">
                Cricket Players
              </span>
            </h1>

            <p className="text-gray-400 mt-6 text-base md:text-xl max-w-lg">
              Find talented players for tournaments and matches near you.
            </p>

            {/* BUTTONS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 md:mt-10 max-w-md">

              <Link to="/FindPlayers" className="bg-linear-to-r flex justify-center items-center from-blue-500 to-purple-600 py-3 px-8 md:py-4 rounded-xl text-base md:text-lg hover:scale-105 transition  ">
                🔍 Find Player
              </Link>

              <Link to="/Log_SignUp" className="bg-linear-to-r flex justify-center items-center from-orange-400 to-red-500 py-3 md:py-4 rounded-xl text-base md:text-lg hover:scale-105 transition">
                🏏 Join Player
              </Link>

              <Link to="/tournaments" className="bg-linear-to-r flex justify-center items-center from-green-400 to-green-600 py-3 md:py-4 rounded-xl text-base md:text-lg hover:scale-105 transition">
                🏆 Create Tournament
              </Link>

              <Link to="/FindPlayers" className="bg-linear-to-r flex justify-center items-center from-gray-700 to-gray-900 py-3 md:py-4 rounded-xl text-base md:text-lg hover:scale-105 transition">
                📅 Book Match
              </Link>

            </div>

          </motion.div>

          {/* HERO BALL */}

          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="flex justify-center"
          >

            <div className="w-28 h-28 md:w-48 md:h-48 bg-linear-to-r from-orange-400 to-red-500 rounded-full shadow-[0_0_40px_rgba(255,100,0,0.6)]" />

          </motion.div>

        </div>



      </section>

      {/* HERO STATS */}
      
      <section className="min-h-screen flex items-center px-6 md:px-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-12">
          <div className="rounded-3xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm shadow-lg">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total players</p>
            <p className="mt-4 text-4xl font-bold">{players.length}</p>
            <p className="mt-2 text-sm text-slate-400">All registered players available on the platform</p>
          </div>
          <div className="rounded-3xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm shadow-lg">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Available now</p>
            <p className="mt-4 text-4xl font-bold">{availablePlayers.length}</p>
            <p className="mt-2 text-sm text-slate-400">Players ready to join a match today</p>
          </div>
          <div className="rounded-3xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm shadow-lg">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Top City</p>
            <p className="mt-4 text-4xl font-bold">{cityCounts[0]?.[0] || "N/A"}</p>
            <p className="mt-2 text-sm text-slate-400">Most players come from this city</p>
          </div>
          <div className="rounded-3xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm shadow-lg">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Near you</p>
            <p className="mt-4 text-4xl font-bold">{playersInCity}</p>
            <p className="mt-2 text-sm text-slate-400">Players in {currentCity}</p>
          </div>
          <div className="rounded-3xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm shadow-lg">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Avg. rating</p>
            <p className="mt-4 text-4xl font-bold">{averageRating}</p>
            <p className="mt-2 text-sm text-slate-400">Overall player performance score</p>
          </div>



        </div>
      </section>

      {/* PLAYER CARDS */}

      <section className="py-16 md:py-24 px-6 md:px-24">

        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">
          Available Players
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">

          {playerLoading ? (
            <div className="col-span-full text-center py-16 text-gray-400">Loading players...</div>
          ) : playerError ? (
            <div className="col-span-full text-center py-16 text-red-400">{playerError}</div>
          ) : topPlayers.length > 0 ? (
            topPlayers.map((player, i) => (
              <motion.div
                key={player._id || i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.07 }}
                className="bg-linear-to-b from-[#121a2bb5] to-[#0B1220] p-6 md:p-8 rounded-xl border border-gray-700 text-center"
              >
                {player.photo ? (
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full mx-auto overflow-hidden">
                    <img
                      src={`${API_URL}/uploads/${player.photo}`}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full mx-auto bg-linear-to-br from-blue-500 via-violet-600 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
                    {player.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}

                <h3 className="text-lg md:text-xl font-bold mt-4">{player.name}</h3>
                <p className="text-gray-400 text-sm md:text-base">{player.role}</p>
                {player.city && (
                  <p className="text-slate-300 text-sm md:text-base mt-1">{player.city}</p>
                )}

                <p className="mt-3 text-yellow-300">{renderRatingStars(getPlayerRating(player.stats))} <span className="text-slate-300">{getPlayerRating(player.stats).toFixed(1)}</span></p>
                <p className="mt-2 text-green-400 text-sm">{player.status || "Available"}</p>

                <div className="flex justify-center gap-3 mt-4 md:mt-5">
                  <button
                    className="bg-linear-to-r from-blue-500 to-purple-600 px-3 md:px-4 py-2 rounded text-sm"
                    onClick={() => navigate(`/PlayerProfile/${player._id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-gray-400">No top players available right now.</div>
          )}

        </div>

      </section>

      {/* ROLE BREAKDOWN */}

      <section className="py-16 md:py-24 px-6 md:px-24 bg-[#121a2b89] rounded-3xl mx-6 md:mx-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12">
          Player Role Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className="rounded-3xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm shadow-lg text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{role}</p>
              <p className="mt-4 text-4xl font-bold">{count}</p>
              <p className="mt-2 text-sm text-slate-400">Registered players</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOOKING STEPS */}

      <section className="py-16 md:py-24 px-6 md:px-24">

        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">
          How Booking Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-w-5xl mx-auto">

          <div className="bg-linear-to-r from-blue-500 to-purple-600 p-8 md:p-10 rounded-xl text-center text-lg md:text-xl">
            1️⃣ Select Player
          </div>

          <div className="bg-linear-to-r from-orange-400 to-red-500 p-8 md:p-10 rounded-xl text-center text-lg md:text-xl">
            2️⃣ Choose Date
          </div>

          <div className="bg-linear-to-r from-green-400 to-green-600 p-8 md:p-10 rounded-xl text-center text-lg md:text-xl">
            3️⃣ Confirm Booking
          </div>

        </div>

      </section>

      {/* TOP PLAYERS */}

      <section className="py-16 md:py-24 px-6 md:px-24 bg-[#121a2bae] text-center">

        <h2 className="text-3xl md:text-4xl font-bold mb-10 md:mb-12">
          🔥 Top Players
        </h2>

        <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-16 text-lg md:text-xl">

          <div>🏏 Best Batsman</div>
          <div>🎯 Best Bowler</div>
          <div>⭐ Top Rated</div>

        </div>

      </section>

    </div>
  );
}