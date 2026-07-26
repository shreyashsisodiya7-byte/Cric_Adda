import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { API_URL } from "../api";
import { RateBookingButton } from "./PlayerRating";

const getDayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const isPast = (booking) => {
  if (!booking?.eventDate) return false;
  return getDayStart(new Date(booking.eventDate)) <= getDayStart(new Date());
};

export default function OwnerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { ownerId: routeOwnerId } = useParams();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const ownerId = routeOwnerId || user._id || localStorage.getItem("userId");
  const userType = user.userType || localStorage.getItem("userType") || "Player";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!ownerId) {
      setError("No owner ID provided. Open this page using /OwnerDashboard/<ownerId>.");
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/bookings/owner/${ownerId}`, {
          headers,
        });
        if (res.data.success) {
          setBookings(res.data.bookings || res.data.requests || []);
        } else {
          setError(res.data.message || "Unable to load owner bookings.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Error loading owner dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [ownerId, token]);

  const acceptedBookings = bookings.filter((booking) => booking.status === "accepted");
  const readyToRate = acceptedBookings.filter((booking) => isPast(booking));
  const upcomingBookings = acceptedBookings.filter((booking) => !isPast(booking));

  const handleRatingUpdate = (bookingId, rating) => {
    setBookings((prev) => prev.map((booking) =>
      booking._id === bookingId ? { ...booking, rating } : booking
    ));
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#0a1628] pt-24" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-10 pb-20">
        <header className="mb-8">
          <div className="inline-flex items-center gap-3 rounded-full bg-[#0a1628] px-4 py-2 text-sm text-white shadow-lg shadow-black/10">
            <span className="text-[#f4b942]">🏆</span>
            Owner Dashboard
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Accepted Bookings & Player Ratings
          </h1>
          <p className="max-w-2xl mt-3 text-sm text-[#475569]">
            See all accepted player bookings for this owner and rate players once the event date has arrived.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white border border-[#e8edf2] p-5 shadow-sm">
              <div className="text-sm text-[#9ca3af] uppercase tracking-[0.2em] mb-2">Accepted bookings</div>
              <div className="text-3xl font-semibold text-[#0a1628]">{acceptedBookings.length}</div>
            </div>
            <div className="rounded-3xl bg-white border border-[#e8edf2] p-5 shadow-sm">
              <div className="text-sm text-[#9ca3af] uppercase tracking-[0.2em] mb-2">Ready to rate</div>
              <div className="text-3xl font-semibold text-[#0a1628]">{readyToRate.length}</div>
            </div>
            <div className="rounded-3xl bg-white border border-[#e8edf2] p-5 shadow-sm">
              <div className="text-sm text-[#9ca3af] uppercase tracking-[0.2em] mb-2">Upcoming events</div>
              <div className="text-3xl font-semibold text-[#0a1628]">{upcomingBookings.length}</div>
            </div>
          </div>
        </header>

        {loading && (
          <div className="rounded-3xl bg-white border border-[#e8edf2] p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-[#f4b942] border-t-transparent animate-spin" />
            <p className="text-sm text-[#475569]">Loading your accepted bookings...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl bg-[#fee2e2] border border-[#fecaca] p-5 text-sm text-[#991b1b]">
            {error}
          </div>
        )}

        {!loading && !error && acceptedBookings.length === 0 && (
          <div className="rounded-3xl bg-white border border-[#e8edf2] p-10 text-center shadow-sm">
            <p className="text-xl font-semibold text-[#0a1628]">No accepted bookings yet</p>
            <p className="mt-2 text-sm text-[#64748b]">Once your booking requests are accepted, they will appear here.</p>
          </div>
        )}

        {!loading && !error && acceptedBookings.length > 0 && (
          <div className="grid gap-5">
            {acceptedBookings.map((booking) => (
              <div key={booking._id} className="rounded-3xl bg-white border border-[#e8edf2] p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.23em] text-[#9ca3af] mb-2">{booking.eventType?.toUpperCase() || "Match"}</div>
                    <h2 className="text-xl font-semibold text-[#0a1628]">{booking.eventName}</h2>
                    <p className="mt-1 text-sm text-[#475569]">Player: <span className="font-semibold text-[#0a1628]">{booking.playerName}</span></p>
                  </div>
                  <div className="grid gap-2 text-right text-sm text-[#475569]">
                    <div>Event date: <span className="font-semibold text-[#0a1628]">{fmtDate(booking.eventDate)}</span></div>
                    <div>Location: <span className="font-semibold text-[#0a1628]">{booking.eventLocation || "TBD"}</span></div>
                    <div>Fee offered: <span className="font-semibold text-[#0a1628]">₹{booking.fee || 0}</span></div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {isPast(booking) ? (
                    <div className="flex flex-wrap gap-2 items-center">
                      {booking.rating?.stars || booking.matchStats?.playerRating ? (
                        <span className="rounded-full bg-[#e0f2fe] text-[#0c4a6e] px-3 py-1 text-xs font-semibold">Rated</span>
                      ) : (
                        <span className="rounded-full bg-[#d1fae5] text-[#065f46] px-3 py-1 text-xs font-semibold">Ready to rate</span>
                      )}
                      <span className="text-sm text-[#64748b]">Event date has arrived or passed.</span>
                    </div>
                  ) : (
                    <div className="rounded-full bg-[#eff6ff] text-[#1e40af] px-3 py-1 text-xs font-semibold">
                      Rating available after {fmtDate(booking.eventDate)}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {isPast(booking) ? (
                      <RateBookingButton booking={booking} onRated={(rating) => handleRatingUpdate(booking._id, rating)} />
                    ) : (
                      <button
                        disabled
                        className="rounded-xl bg-[#e2e8f0] px-4 py-2 text-xs font-semibold text-[#64748b]"
                      >
                        Wait for event date
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
