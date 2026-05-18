import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';

const PlayerProfile = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const currentUserCity = localStorage.getItem("userCity") || "";



  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await axios.get(`${API_URL}/players/profile/${id}`);
        setPlayer(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-xl animate-pulse">
        Loading Player...
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-xl">
        Player not found
      </div>
    );
  }

  const handleBookNow = (player, date = null) => {
    if (!currentUserId) {
      alert("Please login first to book a player");
      navigate("/login");
      return;
    }
    setSelectedPlayer(player);
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 text-white p-6">
      <h1 className="text-4xl font-extrabold text-center mb-10 bg-linear-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
        Player Profile
      </h1>

      <div className="bg-linear-to-br from-gray-800 to-gray-900 p-8 rounded-3xl shadow-2xl max-w-3xl mx-auto border border-gray-700">

        {/* Player Photo */}
        {player.photo ? (
          <div className="mb-8 text-center">
            <img
              src={`${API_URL}/uploads/${player.photo}`}
              alt={player.name}
              className="w-40 h-40 mx-auto rounded-full object-cover shadow-lg border-4 border-blue-500"
            />
          </div>
        ) : (
          <div className="mb-8 text-center">
            <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-5xl font-bold shadow-lg border-4 border-blue-500">
              {player.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { label: 'Name', value: player.name },
            { label: 'Role', value: player.role },
            { label: 'City', value: player.city },
            { label: 'Fee', value: `₹${player.fee}` }
          ].map((item, i) => (
            <div key={i}>
              <label className="block text-gray-400 mb-1 text-sm">{item.label}</label>
              <input
                value={item.value}
                disabled
                className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 outline-none"
              />
            </div>
          ))}
        </div>

        {/* About */}
        <div className="mt-6">
          <label className="block text-gray-400 mb-2">About</label>
          <textarea
            value={player.about}
            disabled
            rows="4"
            className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 outline-none"
          />
        </div>

        {/* Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-400">Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Matches', value: player.stats.matches },
              { label: 'Runs', value: player.stats.runs },
              { label: 'Wickets', value: player.stats.wickets }
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-linear-to-r from-gray-700 to-gray-800 p-4 rounded-2xl text-center shadow-md hover:scale-105 transition"
              >
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Averages */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">Averages</h2>
          <div className="grid grid-cols-2 gap-4">
            {player.stats.matches > 0 && (
              <div className="bg-linear-to-r from-gray-700 to-gray-800 p-4 rounded-2xl text-center shadow-md hover:scale-105 transition">
                <div className="text-lg font-bold">{(player.stats.runs / player.stats.matches).toFixed(2)}</div>
                <div className="text-xs text-gray-400">Batting Average</div>
              </div>
            )}
            {player.stats.wickets > 0 && (
              <div className="bg-linear-to-r from-gray-700 to-gray-800 p-4 rounded-2xl text-center shadow-md hover:scale-105 transition">
                <div className="text-lg font-bold">{(player.stats.runs / player.stats.wickets).toFixed(2)}</div>
                <div className="text-xs text-gray-400">Bowling Average</div>
              </div>
            )}
          </div>
        </div>

        {/* Availability */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-linear-to-r from-green-400 to-emerald-500">Availability (Next 10 Days)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {player.availability.map((avail, index) => {
              const date = new Date();
              date.setDate(date.getDate() + index);
              const dateStr = date.toISOString().split('T')[0];

              return (
                <div
                  key={index}
                  onClick={() => avail && handleBookNow(player, dateStr)}
                  className={`p-3 rounded-2xl text-center shadow-md transition transform hover:scale-105 cursor-pointer ${
                    avail
                      ? 'bg-linear-to-r from-green-400 via-emerald-500 to-green-600'
                      : 'bg-linear-to-r from-gray-700 to-gray-800'
                  }`}
                >
                  <div className="text-xs mb-1">{dateStr}</div>
                  <div className="text-sm font-semibold">
                    {avail ? 'Available' : 'Not Available'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Book Now Button */}
        <button className="mt-8 text-center">
          <div onClick={()=>handleBookNow(player)} className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition duration-300">
            Book Now
          </div>

        {/* Or click on an available date */}
        <div className="mt-4 text-center text-gray-400 text-sm">
          or click on an available date below to book that specific day
        </div>
        </button>
        
        {showBookingModal && selectedPlayer && (
        <BookingModal
          playerId={selectedPlayer._id}
          playerName={selectedPlayer.name}
          playerFee={selectedPlayer.fee}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDate(null);
          }}
          onSuccess={() => {
            // Optional: Show success notification
          }}
          ownerId={currentUserId}
          ownerName={currentUserName}
          ownerCity={currentUserCity}
          date={selectedDate}
        />
      )}
      </div>
    </div>
  );
};

export default PlayerProfile;
