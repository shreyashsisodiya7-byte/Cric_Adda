import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import BookingModal from "../components/BookingModal";

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

 function FindPlayer() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("")
  const [role, setRole] = useState("All");
  const [searchCity, setSearchCity] = useState("");
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const navigate = useNavigate();

  // Get current user info from localStorage
  const currentUserId = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const currentUserCity = localStorage.getItem("userCity") || "";
  const defaultCity = currentUserCity || "";

 useEffect(() => {
   setSearchCity(defaultCity);

  const AllPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
      `${API_URL}/players/all`
    );
    if (res.data.success) {
      setPlayers(res.data.data || []);
    } else {
      setError(res.data.message || "Failed to fetch players");
    }
    } catch (error) {
      console.error("Error fetching players:", error);
      setError(error.response?.data?.message || "Error loading players. Make sure backend is running on port 3000");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };
  const updatedDate = ()=> {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }
  updatedDate();
  AllPlayers();
 }, [defaultCity])

 const filteredPlayers = players.filter((p) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedDateObj = date ? new Date(date) : null;
    const todayObj = new Date(todayStr);
    const daysDiff = selectedDateObj
      ? Math.floor((selectedDateObj - todayObj) / (1000 * 60 * 60 * 24))
      : -1;
    const isAvailableOnDate =
      daysDiff >= 0 &&
      p.availability &&
      p.availability[daysDiff];

    const isStatusAvailable = p.status?.toLowerCase() === "available";
    const isAvailable = isStatusAvailable || isAvailableOnDate;

    const cityMatch = (() => {
      if (!searchCity) return true;
      return p.city?.toLowerCase() === searchCity.toLowerCase();
    })();

    return (
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (role === "All" || p.role === role) &&
      cityMatch &&
      isAvailable
    );
  });

  const handleBookNow = (player) => {
    if (!currentUserId) {
      alert("Please login first to book a player");
      navigate("/login");
      return;
    }
    setSelectedPlayer(player);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-20 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Find Players</h1>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900 border border-red-500 rounded-xl">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center min-h-96">
          <p className="text-xl text-gray-400">Loading players...</p>
        </div>
      )}

      {/* Search & Filter */}
      {!loading && (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl bg-gray-800 outline-none"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-4 py-2 rounded-xl bg-gray-800 w-full"
        >
          <option className="text-[16px] overflow-hidden">All</option>
          <option className="text-[16px] overflow-hidden">Batsman</option>
          <option className="text-[16px] overflow-hidden">Bowler</option>
          <option className="text-[16px] overflow-hidden">All-Rounder</option>
        </select>

        <input
          type="text"
          placeholder="Your city"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          className="px-4 py-2 rounded-xl bg-gray-800 outline-none"
        />

        <input
          type="date"
          placeholder="Select date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 rounded-xl bg-gray-800 outline-none lg:col-span-2"
        />
      </div>
      )}

      {/* Player Cards */}
      {!loading && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player, index) => (
          <div
            key={index}
            className="bg-gray-800 p-5 rounded-2xl shadow-lg"
          >
            {/* Player Photo */}
            {player.photo ? (
              <div className="mb-4 h-40 w-40 mx-auto overflow-hidden rounded-full flex items-center justify-center">
                <img
                  src={`${API_URL}/uploads/${player.photo}`}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="mb-4 h-40 w-40 mx-auto rounded-full bg-gradient-to-br from-blue-500 via-violet-600 to-pink-500 flex items-center justify-center text-4xl font-extrabold text-white shadow-lg shadow-slate-950/30">
                {player.name ? player.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <h2 className="text-xl font-semibold">{player.name}</h2>
            <p className="text-gray-400">{player.role}</p>
            {player.city && (
              <p className="text-gray-300 text-sm mt-1">City: {player.city}</p>
            )}
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-yellow-300">
                <span>{renderRatingStars(getPlayerRating(player.stats))}</span>
                <span className="text-slate-300">{getPlayerRating(player.stats).toFixed(1)} / 5</span>
              </div>
            </div>
            {player.fee && (
              <p className="text-green-400 font-bold mt-3">₹{player.fee}/match</p>
            )}

            <div
              className={`mt-4 px-4 py-2 rounded-xl text-center ${
                player.availability && player.availability[0]
                  ? "bg-linear-to-r from-green-500 to-blue-500"
                  : "bg-gray-700"
              }`}
            >
              {player.availability && player.availability[0] ? "Available" : "Not Available"}
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-xl transition"
                onClick={() => navigate(`/PlayerProfile/${player._id}`)}
              >
                View Profile
              </button>
              <button 
                className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-bold transition"
                onClick={() => handleBookNow(player)}
              >
                📅 Book Now
              </button>
            </div>
          </div>
        ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-xl text-gray-400">No players found matching your criteria</p>
          </div>
        )}
      </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedPlayer && (
        <BookingModal
          playerId={selectedPlayer._id}
          playerName={selectedPlayer.name}
          playerFee={selectedPlayer.fee}
          date={date}

          onClose={() => {
            setShowBookingModal(false);
            setSelectedPlayer(null);
          }}
          onSuccess={() => {
            // Optional: Show success notification
          }}
          ownerId={currentUserId}
          ownerName={currentUserName}
          ownerCity={currentUserCity}
        />
      )}
    </div>
  );
}
export default FindPlayer
