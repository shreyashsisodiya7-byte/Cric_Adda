import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL, UPLOADS_URL } from "../api";
import { Trophy, MapPin, Calendar, CheckCircle, XCircle, Bell } from "lucide-react";

const photoUrl = (p) =>
  p ? (p.startsWith("http") ? p : `${UPLOADS_URL}/${p}`) : null;

export default function PlayerInvites() {
  const [invites, setInvites]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [responding, setResponding] = useState(null);
  const navigate = useNavigate();

  const playerId   = localStorage.getItem("userId");
  const playerName = localStorage.getItem("userName");
  const playerRole = localStorage.getItem("userRole") || "";
  const playerPhoto = localStorage.getItem("userPhoto") || "";
  const token      = localStorage.getItem("token");

  const fetchInvites = async () => {
    if (!playerId || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/tournaments/invites/player/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvites(res.data.invites || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvites(); }, []);

  const respond = async (invite, status) => {
    setResponding(invite.inviteId);
    try {
      await axios.put(
        `${API_URL}/tournaments/${invite.tournamentId}/invites/${invite.inviteId}`,
        { playerId, playerName, playerRole, playerPhoto, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvites((prev) => prev.filter((i) => i.inviteId !== invite.inviteId));
      if (status === "accepted") navigate("/tournaments");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to respond");
    } finally {
      setResponding(null);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 50%,#0f2d1e 100%)" }}>
        Please log in to see your invites.
      </div>
    );
  }

  const statusColors = {
    upcoming: "bg-[#d1fae5] text-[#065f46]",
    ongoing:  "bg-[#dbeafe] text-[#1e40af]",
    default:  "bg-white/10 text-white/60",
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 max-w-2xl mx-auto"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pt-16">
        <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center">
          <Bell size={20} className="text-[#f4b942]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0a1628]"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}>
            Tournament Invites
          </h1>
          <p className="text-[#607080] text-sm">Invitations from tournament owners</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#f4b942] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && invites.length === 0 && (
        <div className="text-center py-20 text-[#607080]">
          <Trophy size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium text-[#0a1628]">No pending invites</p>
          <p className="text-sm mt-1">When an owner invites you, it will appear here.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {invites.map((invite) => {
          const bannerUrl = photoUrl(invite.banner);
          const isBusy    = responding === invite.inviteId;
          const statusCls = statusColors[invite.status] || statusColors.default;

          return (
            <div
              key={invite.inviteId}
              className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              style={{ border: "1.5px solid #e8edf2" }}
            >
              {bannerUrl && (
                <img src={bannerUrl} alt={invite.tournamentName}
                  className="w-full h-28 object-cover" />
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-[#0a1628] font-bold text-lg">{invite.tournamentName}</h2>
                    <p className="text-[#607080] text-sm">Invited by {invite.ownerName}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusCls}`}>
                    {invite.status?.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 mb-3">
                  <span className="flex items-center gap-1 text-[#607080] text-xs">
                    <MapPin size={12} /> {invite.city}
                  </span>
                  <span className="flex items-center gap-1 text-[#607080] text-xs">
                    <Trophy size={12} /> {invite.format}
                  </span>
                  <span className="flex items-center gap-1 text-[#607080] text-xs">
                    <Calendar size={12} />
                    {new Date(invite.startDate).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>

                {invite.message && (
                  <p className="text-[#607080] text-sm bg-[#f4f7fb] rounded-xl px-3 py-2 mb-4 italic"
                    style={{ border: "1px solid #e8edf2" }}>
                    "{invite.message}"
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => respond(invite, "accepted")}
                    disabled={isBusy}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f4b942] text-[#0a1628] font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {isBusy ? "Processing…" : "Accept & Join"}
                  </button>
                  <button
                    onClick={() => respond(invite, "declined")}
                    disabled={isBusy}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[#607080] font-semibold text-sm hover:border-[#0a1628] hover:text-[#0a1628] transition-colors disabled:opacity-50"
                    style={{ borderColor: "#e8edf2" }}
                  >
                    <XCircle size={16} />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
