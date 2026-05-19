import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";

const TAB_OPTIONS = [
  { key: "pending", label: "Pending" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "recent", label: "Recent" },
  { key: "all", label: "All" },
];

const getDayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const isUpcomingBooking = (item) => {
  if (!item.eventDate) return false;
  const eventDate = new Date(item.eventDate);
  return eventDate >= getDayStart(new Date());
};
const isPastBooking = (item) => {
  if (!item.eventDate) return false;
  const eventDate = new Date(item.eventDate);
  return eventDate < getDayStart(new Date());
};
const isRecentBooking = (item) => {
  const createdAt = new Date(item.createdAt || item.respondedAt || item.eventDate);
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
  return createdAt >= since;
};

const filterBookings = (items, filter) => {
  const normalized = items || [];

  switch (filter) {
    case "pending":
      return normalized.filter((item) => item.status === "pending");
    case "upcoming":
      return normalized.filter((item) => isUpcomingBooking(item));
    case "past":
      return normalized.filter((item) => isPastBooking(item));
    case "recent":
      return normalized.filter((item) => isRecentBooking(item));
    default:
      return normalized;
  }
};

const countByCategory = (items, key) => filterBookings(items, key).length;

function BookingRequests() {
  const [allRequests, setAllRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [respondingId, setRespondingId] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [prevRequestIds, setPrevRequestIds] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  const userId = user._id || localStorage.getItem("userId");
  const userType = user.userType || localStorage.getItem("userType") || "Player";
  const isOwner = userType === "Owner";
  const token = localStorage.getItem("token");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        userType === "Owner"
          ? `/bookings/owner/${userId}`
          : `/bookings/player/${userId}/all`;

const response = await axios.get(`${API_URL}${endpoint}`, {
  headers: { Authorization: `Bearer ${token}` }
});
      if (response.data.success) {
        const items = response.data.requests || response.data.bookings || [];
        const currentIds = items.map((item) => item._id);

        setAllRequests(items);
        setRequests(filterBookings(items, filter));

        setPrevRequestIds((prevIds) => {
          if (prevIds.length > 0 && currentIds.some((id) => !prevIds.includes(id))) {
            setHasNewRequest(true);
          }
          return currentIds;
        });
      } else {
        setError("Unable to load booking requests.");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load booking requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      alert("Please login first");
      navigate("/");
      return;
    }

    fetchRequests();
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [userId, userType, filter, navigate]);

  useEffect(() => {
    setRequests(filterBookings(allRequests, filter));
  }, [filter, allRequests]);

  const handleAccept = async (bookingId) => {
    if (!responseMessage.trim()) {
      alert("Please add a response message");
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/bookings/${bookingId}/accept`,
        { playerResponse: responseMessage },
         {
  headers: { Authorization: `Bearer ${token}` }
}
      );
      if (response.data.success) {
        alert("Request accepted! You can now message the owner.");
        setResponseMessage("");
        setRespondingId(null);
        setAllRequests((prev) =>
          prev.map((item) =>
            item._id === bookingId
              ? { ...item, status: "accepted", playerResponse: responseMessage }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Failed to accept request");
    }
  };

  const handleReject = async (bookingId) => {
    if (!responseMessage.trim()) {
      alert("Please add a reason for rejection");
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/bookings/${bookingId}/reject`,
        { playerResponse: responseMessage }
      );
      if (response.data.success) {
        alert("Request rejected");
        setResponseMessage("");
        setRespondingId(null);
        setAllRequests((prev) =>
          prev.map((item) =>
            item._id === bookingId
              ? { ...item, status: "rejected", playerResponse: responseMessage }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert("Failed to reject request");
    }
  };

  const statusColor = (status) => {
    if (status === "pending") return "bg-yellow-900 text-yellow-200";
    if (status === "accepted") return "bg-green-900 text-green-200";
    return "bg-red-900 text-red-200";
  };

  const badgeText = (request) => {
    if (request.status === "pending") return "Waiting";
    if (isUpcomingBooking(request)) return "Upcoming";
    if (isPastBooking(request)) return "Completed";
    return "Active";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-25 md:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-900/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">Booking Requests</h1>
              <p className="mt-2 text-slate-400 max-w-2xl">
                Track all recent, upcoming, past and pending booking requests in one place. Use the tabs and summary cards to focus on the bookings that matter most.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TAB_OPTIONS.filter((tab) => tab.key !== "all").map((tab) => (
                <div key={tab.key} className="rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-slate-800/90 border border-slate-800 px-4 py-4 text-center shadow-lg shadow-slate-950/20">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{tab.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{countByCategory(allRequests, tab.key)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {TAB_OPTIONS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setFilter(tab.key);
                  if (tab.key === "pending") setHasNewRequest(false);
                }}
                className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
                  filter === tab.key
                    ? "border-blue-500 bg-blue-500/20 text-blue-100 shadow-lg shadow-blue-500/10"
                    : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {tab.label}
                  {tab.key === "pending" && hasNewRequest && (
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  )}
                </span>
              </button>
            ))}
          </div>
          {hasNewRequest && filter !== "pending" && (
            <div className="mt-4 rounded-2xl border border-red-600 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              New booking request received. Open the Pending tab to review it.
            </div>
          )}
        </section>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400 shadow-xl shadow-slate-950/20">
            Loading booking requests...
          </div>
        ) : error ? (
          <div className="mt-10 rounded-3xl border border-red-800 bg-red-950/70 p-8 text-center text-red-200 shadow-xl shadow-red-950/20">
            {error}
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {requests.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-400 shadow-xl shadow-slate-950/20">
                <p className="text-xl font-semibold text-white">No {filter} booking requests yet.</p>
                <p className="mt-2 text-sm text-slate-500">Check another category or create a new booking request to get started.</p>
              </div>
            ) : (
              requests.map((request) => {
                const eventDate = new Date(request.eventDate || request.createdAt);
                return (
                  <article key={request._id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/15">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-sm text-slate-300">
                            {badgeText(request)}
                          </span>
                        </div>
                        <h2 className="text-2xl font-semibold text-white">{request.eventName}</h2>
                        <p className="text-slate-400">
                          {isOwner ? "Booking for" : "Booking from"} <span className="text-sky-300">{isOwner ? request.playerName : request.ownerName}</span>
                        </p>
                      </div>
                      <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl bg-slate-950/80 p-4 text-sm text-slate-300">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Event Date</p>
                          <p className="mt-2 text-white">{eventDate.toLocaleDateString()}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-950/80 p-4 text-sm text-slate-300">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Location</p>
                          <p className="mt-2 text-white">{request.eventLocation || "TBD"}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-950/80 p-4 text-sm text-slate-300">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Offer</p>
                          <p className="mt-2 text-white">₹{request.fee || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-slate-300">
                        <p className="text-sm text-slate-500">Booking Type</p>
                        <p className="mt-2 text-white capitalize">{request.eventType || "Match"}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-slate-300">
                        <p className="text-sm text-slate-500">Requested On</p>
                        <p className="mt-2 text-white">{new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {request.message && (
                      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-slate-300">
                        <p className="text-sm text-slate-400">Owner message</p>
                        <p className="mt-3 text-white">{request.message}</p>
                      </div>
                    )}

                    {request.playerResponse && (
                      <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-slate-300">
                        <p className="text-sm text-slate-400">Your response</p>
                        <p className="mt-3 text-white">{request.playerResponse}</p>
                      </div>
                    )}

                    <div className="mt-6 space-y-4">
                      {request.status === "accepted" ? (
                        <button
                          onClick={() => navigate("/Messages")}
                          className="w-full rounded-2xl bg-sky-500 px-5 py-3 text-base font-semibold text-white transition hover:bg-sky-400"
                        >
                          💬 Message {isOwner ? request.playerName : request.ownerName}
                        </button>
                      ) : request.status === "pending" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            onClick={() => setRespondingId(request._id)}
                            className="rounded-2xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-500"
                          >
                            Respond to request
                          </button>
                          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-slate-300">
                            <p className="text-sm text-slate-500">Status</p>
                            <p className="mt-2 text-white">This booking is waiting for your response.</p>
                          </div>
                        </div>
                      ) : null}

                      {respondingId === request._id && (
                        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-slate-300">
                          <textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            placeholder="Write your response here..."
                            className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                            rows={4}
                          />
                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <button
                              onClick={() => handleAccept(request._id)}
                              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                            >
                              Confirm Accept
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => {
                                setRespondingId(null);
                                setResponseMessage("");
                              }}
                              className="flex-1 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingRequests;
