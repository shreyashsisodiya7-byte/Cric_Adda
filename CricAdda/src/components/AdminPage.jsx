import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL, UPLOADS_URL } from "../api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-[#0B1220] border border-gray-700 rounded-2xl p-6 text-center">
    <p className={`text-4xl font-bold ${color}`}>{value}</p>
    <p className="text-gray-400 text-sm mt-2 uppercase tracking-widest">{label}</p>
  </div>
);

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("users"); 
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null); 
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, bookingsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers: authHeaders() }),
        axios.get(`${API_URL}/admin/users`, { headers: authHeaders() }),
        axios.get(`${API_URL}/admin/bookings`, { headers: authHeaders() }),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.data || []);
      setBookings(bookingsRes.data.data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        showToast("Access denied — admins only", "error");
        setTimeout(() => navigate("/"), 1500);
      } else {
        showToast("Failed to load admin data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── delete user ──
  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Delete "${name}"? This removes their account, profile and all bookings.`)) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, { headers: authHeaders() });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showToast(`${name} deleted`);
    } catch {
      showToast("Failed to delete user", "error");
    }
  };

  // ── set status ──
  const handleSetStatus = async (userId, status) => {
    try {
      await axios.patch(
        `${API_URL}/admin/users/${userId}/status`,
        { status },
        { headers: authHeaders() }
      );
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, status } : u));
      showToast(`Status set to "${status}"`);
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  // ── archive toggle ──
  const handleArchive = async (userId, archive) => {
    try {
      await axios.patch(
        `${API_URL}/admin/users/${userId}/status`,
        { archived: archive },
        { headers: authHeaders() }
      );
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, archived: archive } : u));
      showToast(archive ? "Player archived" : "Player unarchived");
    } catch {
      showToast("Failed to archive player", "error");
    }
  };

  // ── open edit modal ──
  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.Fullname,
      role: user.role,
      city: user.city,
      fee: user.fee,
      userType: user.userType,
      status: user.status,
    });
  };

  // ── save edit ──
  const handleSaveEdit = async () => {
    try {
      await axios.patch(
        `${API_URL}/admin/users/${editingUser._id}/edit`,
        editForm,
        { headers: authHeaders() }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === editingUser._id
            ? { ...u, Fullname: editForm.name, ...editForm }
            : u
        )
      );
      setEditingUser(null);
      showToast("Profile updated");
    } catch {
      showToast("Failed to update profile", "error");
    }
  };

  // ── delete booking ──
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await axios.delete(`${API_URL}/admin/bookings/${bookingId}`, { headers: authHeaders() });
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
      showToast("Booking deleted");
    } catch {
      showToast("Failed to delete booking", "error");
    }
  };

  // ── filtered users ──
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.Fullname?.toLowerCase().includes(search.toLowerCase()) ||
      u.Email?.toLowerCase().includes(search.toLowerCase()) ||
      u.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "All" ||
      (statusFilter === "Archived" ? u.archived : u.status === statusFilter);
    return matchSearch && matchStatus;
  });

  // ── status badge ──
  const StatusBadge = ({ status, archived }) => {
    if (archived) return <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">Archived</span>;
    if (status === "Available") return <span className="px-2 py-1 rounded-full text-xs bg-green-900 text-green-300">Available</span>;
    return <span className="px-2 py-1 rounded-full text-xs bg-red-900 text-red-300">{status || "N/A"}</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white text-xl">
      Loading admin panel...
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-[#020617] via-[#0B1220] to-[#020617] text-white px-4 md:px-10 py-10 mt-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === "error" ? "bg-red-700" : "bg-green-700"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold">🛡️ Admin Panel</h1>
        <p className="text-gray-400 mt-1">Full control over users, players and bookings</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Users" value={stats.totalUsers} color="text-blue-400" />
          <StatCard label="Available" value={stats.availablePlayers} color="text-green-400" />
          <StatCard label="Archived" value={stats.archivedPlayers} color="text-gray-400" />
          <StatCard label="Total Bookings" value={stats.totalBookings} color="text-purple-400" />
          <StatCard label="Pending" value={stats.pendingBookings} color="text-yellow-400" />
          <StatCard label="Accepted" value={stats.acceptedBookings} color="text-emerald-400" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("users")}
          className={`px-6 py-2 rounded-xl font-semibold transition ${tab === "users" ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}
        >
          👤 Users & Players
        </button>
        <button
          onClick={() => setTab("bookings")}
          className={`px-6 py-2 rounded-xl font-semibold transition ${tab === "bookings" ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"}`}
        >
          📅 Bookings
        </button>
      </div>

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by name, email or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl bg-gray-800 outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-gray-800 outline-none"
            >
              <option>All</option>
              <option>Available</option>
              <option>Not Available</option>
              <option>Archived</option>
            </select>
          </div>

          <p className="text-gray-500 text-sm mb-4">{filteredUsers.length} user(s) found</p>

          {/* User Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`bg-[#0B1220] border rounded-2xl p-5 flex flex-col gap-3 ${user.archived ? "border-gray-700 opacity-60" : "border-gray-700"}`}
              >
                {/* Top row */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold shrink-0">
                    {user.photo
                      ? <img src={`${UPLOADS_URL}/${user.photo}`} className="w-full h-full object-cover rounded-full" alt="" />
                      : user.Fullname?.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.Fullname}</p>
                    <p className="text-gray-400 text-xs truncate">{user.Email}</p>
                  </div>
                  <StatusBadge status={user.status} archived={user.archived} />
                </div>

                {/* Info */}
                <div className="text-sm text-gray-400 grid grid-cols-2 gap-1">
                  <span>🎭 {user.role}</span>
                  <span>📍 {user.city || "—"}</span>
                  <span>💼 {user.userType}</span>
                  <span>💰 ₹{user.fee || 0}</span>
                </div>

                <p className="text-xs text-gray-600 font-mono truncate">ID: {user._id}</p>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => openEdit(user)}
                    className="py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-sm transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id, user.Fullname)}
                    className="py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-sm transition"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => handleSetStatus(user._id, user.status === "Available" ? "Not Available" : "Available")}
                    className="py-1.5 rounded-lg bg-yellow-700 hover:bg-yellow-600 text-sm transition"
                  >
                    {user.status === "Available" ? "🔴 Disable" : "🟢 Enable"}
                  </button>
                  <button
                    onClick={() => handleArchive(user._id, !user.archived)}
                    className="py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition"
                  >
                    {user.archived ? "📤 Unarchive" : "📦 Archive"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── BOOKINGS TAB ── */}
      {tab === "bookings" && (
        <div className="overflow-x-auto rounded-2xl border border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Fee</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3">{b.ownerName}</td>
                  <td className="px-4 py-3">{b.playerName}</td>
                  <td className="px-4 py-3">{b.eventName}</td>
                  <td className="px-4 py-3">{new Date(b.eventDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      b.status === "accepted" ? "bg-green-900 text-green-300"
                      : b.status === "rejected" ? "bg-red-900 text-red-300"
                      : "bg-yellow-900 text-yellow-300"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">₹{b.fee || 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteBooking(b._id)}
                      className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded-lg text-xs transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B1220] border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5">✏️ Edit — {editingUser.Fullname}</h2>

            <div className="space-y-3">
              {[
                { label: "Name", key: "name", type: "text" },
                { label: "City", key: "city", type: "text" },
                { label: "Fee (₹)", key: "fee", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input
                    type={type}
                    value={editForm[key] || ""}
                    onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 outline-none border border-gray-700 focus:border-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 outline-none"
                >
                  {["Batsman", "Bowler", "All Rounder", "Wicket Keeper"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">User Type</label>
                <select
                  value={editForm.userType}
                  onChange={(e) => setEditForm((p) => ({ ...p, userType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 outline-none"
                >
                  <option>Player</option>
                  <option>Owner</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 outline-none"
                >
                  <option>Available</option>
                  <option>Not Available</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-semibold"
              >
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
