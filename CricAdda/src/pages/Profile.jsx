import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UniversalContext from "../context/UniversalContext";
import { API_URL, UPLOADS_URL } from "../api";
import ForgotPasswordModal from "../components/Forgotpasswordmodal";
import { PlayerRatingsPanel, ClickableStarRating } from "../pages/PlayerRating";

// ── Google Fonts ───────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector(`link[href="${fontLink.href}"]`))
  document.head.appendChild(fontLink);

// ── Helpers ────────────────────────────────────────────────────────────────────
const roleCardBg = {
  "🏏 Batsman":     "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  "🎯 Bowler":      "linear-gradient(135deg,#d1fae5,#a7f3d0)",
  "🔥 All Rounder": "linear-gradient(135deg,#fef3c7,#fde68a)",
  Batsman:          "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  Bowler:           "linear-gradient(135deg,#d1fae5,#a7f3d0)",
  "All-Rounder":    "linear-gradient(135deg,#fef3c7,#fde68a)",
};

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, editMode, onChange }) {
  return (
    <div
      className="bg-white rounded-2xl p-4 text-center"
      style={{ border: "1.5px solid #e8edf2", borderTop: `4px solid ${accent}` }}
    >
      {editMode ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-center bg-transparent border-none outline-none text-4xl"
          style={{ fontFamily: "'Bebas Neue', sans-serif", color: accent, padding: "4px 8px" }}
        />
      ) : (
        <div className="text-4xl leading-none text-[#0a1628]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          {value}
        </div>
      )}
      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{label}</div>
    </div>
  );
}

// ── Change Password Modal ──────────────────────────────────────────────────────
function ChangePasswordModal({ onClose, onSuccess }) {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showCur, setShowCur]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [showCon, setShowCon]   = useState(false);
  const [showForgotPw, setShowForgotPw] = useState(false);
  const token = localStorage.getItem("token");

  const inputBase = "w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#e8edf2] bg-[#f8fafc] text-[#0a1628] outline-none focus:border-[#f4b942] transition-colors pr-10";

  const submit = async () => {
    setError("");
    if (!current || !next || !confirm) { setError("All fields are required."); return; }
    if (next.length < 6)               { setError("New password must be at least 6 characters."); return; }
    if (next !== confirm)              { setError("New passwords do not match."); return; }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/user/change-password`,
        { currentPassword: current, newPassword: next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess("Password changed successfully! 🎉");
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(10,22,40,0.7)" }}>
      {/* Nested Forgot Password modal */}
      {showForgotPw && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPw(false)}
          onSuccess={(msg) => { setShowForgotPw(false); onSuccess(msg); onClose(); }}
        />
      )}
      <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl" style={{ border: "1.5px solid #e8edf2" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-[#0a1628]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            🔒 Change Password
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer bg-transparent border-none">✕</button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: "#fee2e2", border: "1.5px solid #fecaca", color: "#991b1b" }}>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Current password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-1">Current Password</label>
            <div className="relative">
              <input type={showCur ? "text" : "password"} value={current} onChange={e => setCurrent(e.target.value)} className={inputBase} placeholder="Enter current password" />
              <button type="button" onClick={() => setShowCur(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-sm">
                {showCur ? "🙈" : "👁"}
              </button>
            </div>
            {/* Forgot Password link */}
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowForgotPw(true)}
                className="text-[#f4b942] text-xs hover:underline bg-transparent border-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          </div>
          {/* New password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-1">New Password</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={next} onChange={e => setNext(e.target.value)} className={inputBase} placeholder="At least 6 characters" />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-sm">
                {showNew ? "🙈" : "👁"}
              </button>
            </div>
            {/* Strength bar */}
            {next.length > 0 && (
              <div className="mt-1.5 flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                    style={{ background: next.length >= i * 2 ? (next.length >= 8 ? "#059669" : next.length >= 6 ? "#f4b942" : "#ef4444") : "#e8edf2" }}
                  />
                ))}
                <span className="text-[10px] text-gray-400 ml-1">
                  {next.length >= 8 ? "Strong" : next.length >= 6 ? "Medium" : "Weak"}
                </span>
              </div>
            )}
          </div>
          {/* Confirm password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-1">Confirm New Password</label>
            <div className="relative">
              <input type={showCon ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} className={inputBase} placeholder="Repeat new password" />
              <button type="button" onClick={() => setShowCon(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-sm">
                {showCon ? "🙈" : "👁"}
              </button>
            </div>
            {confirm.length > 0 && next !== confirm && (
              <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: "#f4f7fb", color: "#607080", border: "1.5px solid #e8edf2" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "#f4b942", color: "#0a1628", border: "none" }}>
            {loading ? "Saving…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Account Modal ───────────────────────────────────────────────────────
function DeleteAccountModal({ onClose, onDeleted }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [step, setStep]         = useState(1); // 1 = warning, 2 = confirm password
  const [showForgotPw, setShowForgotPw] = useState(false);
  const token = localStorage.getItem("token");

  const inputBase = "w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#e8edf2] bg-[#f8fafc] text-[#0a1628] outline-none focus:border-red-400 transition-colors pr-10";

  const confirm = async () => {
    setError("");
    if (!password) { setError("Please enter your password."); return; }
    setLoading(true);
    try {
      // 1. Verify password
      await axios.post(
        `${API_URL}/user/verify-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // 2. Full cascade delete
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await axios.delete(`${API_URL}/user/delete/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDeleted();
    } catch (e) {
      setError(e.response?.data?.message || "Could not delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const WILL_DELETE = [
    { icon: "👤", label: "Your profile & personal info" },
    { icon: "🏏", label: "Player stats and ratings" },
    { icon: "🏆", label: "Tournaments you created" },
    { icon: "📋", label: "All booking requests (sent & received)" },
    { icon: "💬", label: "Messages and conversations" },
    { icon: "⭐", label: "Ratings given and received" },
  ];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(10,22,40,0.75)" }}>
      {/* Nested Forgot Password modal */}
      {showForgotPw && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPw(false)}
          onSuccess={(msg) => { setShowForgotPw(false); alert(msg); }}
        />
      )}
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" style={{ border: "1.5px solid #fecaca" }}>

        {/* Red header bar */}
        <div className="px-6 pt-6 pb-4" style={{ background: "#fef2f2" }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl text-red-700" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              🗑️ Delete Account
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer bg-transparent border-none">✕</button>
          </div>
          <p className="text-red-600 text-xs font-semibold">⚠️ This is permanent and cannot be undone.</p>
        </div>

        <div className="px-6 py-5">
          {step === 1 && (
            <>
              {/* What gets deleted checklist */}
              <p className="text-[#0a1628] text-sm font-semibold mb-3">The following will be permanently deleted:</p>
              <ul className="space-y-2 mb-5">
                {WILL_DELETE.map(({ icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm text-[#607080]">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: "#fee2e2" }}>
                      {icon}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>

              {/* Archive note */}
              <div className="px-3.5 py-2.5 rounded-xl text-xs text-[#607080] mb-5"
                style={{ background: "#f4f7fb", border: "1px solid #e8edf2" }}>
                📦 A backup of your data is archived internally for compliance purposes and is not publicly accessible.
              </div>

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: "#f4f7fb", color: "#607080", border: "1.5px solid #e8edf2" }}>
                  Cancel
                </button>
                <button onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: "#dc2626", color: "#fff", border: "none" }}>
                  I understand, continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-[#0a1628] text-sm font-semibold mb-4">
                Enter your password to permanently delete your account:
              </p>

              {error && (
                <div className="mb-4 px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "#fee2e2", border: "1.5px solid #fecaca", color: "#991b1b" }}>
                  {error}
                </div>
              )}

              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirm()}
                    className={inputBase}
                    placeholder="Your account password"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-sm">
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
                {/* Forgot Password link */}
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPw(true)}
                    className="text-[#f4b942] text-xs hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setError(""); setPassword(""); }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: "#f4f7fb", color: "#607080", border: "1.5px solid #e8edf2" }}>
                  ← Back
                </button>
                <button onClick={confirm} disabled={loading || !password}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#dc2626", color: "#fff", border: "none" }}>
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting…
                    </>
                  ) : "Delete My Account"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Settings Panel ─────────────────────────────────────────────────────────────
function SettingsPanel({ onChangePassword, onDeleteAccount, onLogout }) {
  const items = [
    {
      icon: "🔒",
      title: "Change Password",
      desc: "Update your account password",
      action: onChangePassword,
      color: "#3b82f6",
      bg: "#eff6ff",
      border: "#bfdbfe",
    },
    {
      icon: "🚪",
      title: "Logout",
      desc: "Sign out of your account",
      action: onLogout,
      color: "#6b7280",
      bg: "#f9fafb",
      border: "#e5e7eb",
    },
    {
      icon: "🗑️",
      title: "Delete Account",
      desc: "Permanently remove your account and all data",
      action: onDeleteAccount,
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
      danger: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: "1.5px solid #e8edf2" }}>
      <div className="text-xl mb-5 flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#0a1628" }}>
        ⚙️ Account Settings
      </div>
      <div className="flex flex-col gap-3">
        {items.map(({ icon, title, desc, action, color, bg, border, danger }) => (
          <button
            key={title}
            onClick={action}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all text-left hover:scale-[1.01]"
            style={{ background: bg, border: `1.5px solid ${border}` }}
          >
            <span className="text-2xl shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm" style={{ color: danger ? "#dc2626" : "#0a1628" }}>{title}</div>
              <div className="text-[11px] mt-0.5" style={{ color: danger ? "#ef4444" : "#9ca3af" }}>{desc}</div>
            </div>
            <span className="text-lg" style={{ color }}>{danger ? "⚠️" : "›"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Profile Component ─────────────────────────────────────────────────────
export default function Profile() {
  const [editMode, setEditMode]         = useState(false);
  const [name, setName]                 = useState("Player Name");
  const [userType, setUserType]         = useState("Player");
  const [role, setRole]                 = useState("🏏 Batsman");
  const [city, setCity]                 = useState("");
  const [fee, setFee]                   = useState("");
  const [about, setAbout]               = useState("");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [photo, setPhoto]               = useState("");
  const [file, setFile]                 = useState(null);
  const [toast, setToast]               = useState({ show: false, msg: "", ok: true });
  const [stats, setStats]               = useState({ matches: 0, runs: 0, wickets: 0, oversBowled: 0, runsConceded: 0 });
  const [availability, setAvailability] = useState(Array(10).fill(false));
  const [next10Days, setNext10Days]     = useState([]);
  const [player, setPlayer] = useState(null);

  // modals
  const [showChangePw, setShowChangePw] = useState(false);
  const [showDeleteAcc, setShowDeleteAcc] = useState(false);

  const token = localStorage.getItem("token");
  const { setToken } = useContext(UniversalContext);
  const navigate = useNavigate();

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast({ show: false, msg: "", ok: true }), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const res = await axios.get(`${API_URL}/players/profile/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.data;
        if (d) {
          setName(d.name || "Player Name");
          setUserType(d.userType || "Player");
          setRole(d.role || "🏏 Batsman");
          setCity(d.city || "");
          setFee(d.fee || "");
          setAbout(d.about || "");
          setStats({
            matches:      d.stats?.matches      || 0,
            runs:         d.stats?.runs         || 0,
            wickets:      d.stats?.wickets      || 0,
            oversBowled:  d.stats?.oversBowled  || 0,
            runsConceded: d.stats?.runsConceded || 0,
          });
          setAvailability(Array.isArray(d.availability) ? d.availability : Array(10).fill(false));
          setPhoto(d.photo ? (d.photo.startsWith("http") ? d.photo : `${UPLOADS_URL}/${d.photo}`) : "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    setNext10Days(Array.from({ length: 10 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i); return d;
    }));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const fd = new FormData();
      fd.append("name", name); fd.append("userType", userType); fd.append("role", role);
      fd.append("city", city); fd.append("fee", fee); fd.append("about", about);
      fd.append("stats", JSON.stringify(stats)); fd.append("availability", JSON.stringify(availability));
      if (file) fd.append("photo", file);
      await axios.put(`${API_URL}/players/update/${user._id}`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditMode(false);
      showToast("Profile updated successfully!");
    } catch {
      showToast("Update failed. Please try again.", false);
    } finally {
      setSaving(false);
    }
  };

  const userLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    navigate("/Log_SignUp");
  };

  const handleAccountDeleted = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    navigate("/Log_SignUp");
  };

  const setStat = (key) => (val) => setStats((p) => ({ ...p, [key]: val }));

  const isBatsman  = role.includes("Batsman") || role.includes("All");
  const isBowler   = role.includes("Bowler")  || role.includes("All");
  const strikeRate = stats.matches > 0 ? (stats.runs / stats.matches).toFixed(1) : "0.0";
  const economy    = stats.oversBowled > 0 ? (stats.runsConceded / stats.oversBowled).toFixed(2) : "0.00";
  const roleBg     = roleCardBg[role] || "linear-gradient(135deg,#f0f4ff,#e0e7ff)";
  const isAvailNow = availability[0];

  const inputCls   = "w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#e8edf2] bg-[#f8fafc] text-[#0a1628] outline-none focus:border-[#f4b942] transition-colors";
  const selectCls  = `${inputCls} cursor-pointer`;

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f4f7fb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="w-11 h-11 rounded-full border-[3px] border-[#e8edf2]" style={{ borderTopColor: "#f4b942", animation: "spin 0.8s linear infinite" }} />
        <p className="text-[#0a1628] text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Loading Profile</p>
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .quick-card:hover  { transform: translateY(-3px); border-color: #f4b942 !important; }
        * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* ── Modals ── */}
      {showChangePw && (
        <ChangePasswordModal
          onClose={() => setShowChangePw(false)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
      {showDeleteAcc && (
        <DeleteAccountModal
          onClose={() => setShowDeleteAcc(false)}
          onDeleted={handleAccountDeleted}
        />
      )}

      <div className="min-h-screen bg-[#f4f7fb] text-[#0a1628] pt-16">

        {/* ── TOAST ── */}
        {toast.show && (
          <div
            className="fixed top-20 right-4 z-300 px-5 py-3 rounded-xl text-sm font-medium shadow-lg"
            style={{
              background: toast.ok ? "#d1fae5" : "#fee2e2",
              border: `1.5px solid ${toast.ok ? "#a7f3d0" : "#fecaca"}`,
              color: toast.ok ? "#065f46" : "#991b1b",
              animation: "slideIn 0.3s ease",
            }}
          >
            {toast.msg}
          </div>
        )}

        {/* ── HERO BAND ── */}
        <section className="px-4 sm:px-10 py-10 sm:py-12"
          style={{ background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 55%,#0f2d1e 100%)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row gap-6 sm:gap-7 items-center sm:items-start"
              style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.12)" }}>

              {/* Avatar col */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                {photo ? (
                  <img src={photo} alt={name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
                    style={{ border: "4px solid #f4b942", boxShadow: "0 0 28px rgba(244,185,66,0.35)" }} />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-4xl"
                    style={{ background: roleBg, border: "4px solid #f4b942", boxShadow: "0 0 28px rgba(244,185,66,0.35)" }}>
                    {name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ background: "rgba(244,185,66,0.15)", border: "1px solid rgba(244,185,66,0.3)", color: "#f4b942" }}>
                  {role}
                </span>
                <span className="text-xs font-semibold" style={{ color: isAvailNow ? "#34d399" : "#9ca3af" }}>
                  {isAvailNow ? "● Available" : "● Unavailable"}
                </span>
                {editMode && (
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(244,185,66,0.15)", border: "1px solid rgba(244,185,66,0.3)", color: "#f4b942" }}>
                    📷 Change Photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (!e.target.files?.[0]) return;
                      setFile(e.target.files[0]);
                      setPhoto(URL.createObjectURL(e.target.files[0]));
                    }} />
                  </label>
                )}
              </div>

              {/* Info col */}
              <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                {editMode ? (
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full mb-3 rounded-xl px-3 py-2 text-white text-2xl outline-none tracking-wide"
                    style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", fontFamily: "'Bebas Neue', sans-serif" }} />
                ) : (
                  <h1 className="text-white mb-2.5 leading-none tracking-wide text-4xl sm:text-5xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {name}
                  </h1>
                )}

                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <span>📍 {city || "No city"}</span>
                  <span>💰 ₹{fee || 0}/match</span>
                </div>

                {editMode && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>User Type</label>
                      <select value={userType} onChange={(e) => setUserType(e.target.value)} className={selectCls}>
                        <option>Player</option><option>Owner</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Playing Role</label>
                      <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
                        <option>🏏 Batsman</option><option>🎯 Bowler</option><option>🔥 All Rounder</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Fee (₹/match)</label>
                      <input type="number" value={fee} onChange={(e) => { if (e.target.value.length <= 6) setFee(e.target.value); }} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>City</label>
                      <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                )}

                {!editMode && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mb-4">
                    {[
                      { label: "User Type", val: userType },
                      { label: "Role",      val: role },
                      { label: "Fee",       val: `₹${fee || 0}/match` },
                      { label: "City",      val: city || "N/A" },
                      { label: "Matches",   val: stats.matches },
                    ].map(({ label, val }) => (
                      <div key={label} className="rounded-lg px-3 py-2"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
                        <div className="text-sm font-semibold text-white">{val}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Button row */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 pt-4 mt-1 items-center"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  {!editMode ? (
                    <button className="px-5 py-2.5 rounded-lg font-bold text-sm bg-[#f4b942] text-[#0a1628] border-none cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setEditMode(true)}>
                      ✏️ Edit Profile
                    </button>
                  ) : (
                    <>
                      <button className="px-5 py-2.5 rounded-lg font-bold text-sm bg-[#059669] text-white border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
                        disabled={saving} onClick={saveProfile}>
                        {saving ? "Saving…" : "💾 Save Changes"}
                      </button>
                      <button className="px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ background: "transparent", color: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(255,255,255,0.25)" }}
                        onClick={() => setEditMode(false)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTENT ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-10 py-8 pb-20">

          {/* Batting Stats */}
          {isBatsman && (
            <div className="mb-5">
              <span className="inline-block bg-[#e8f5e9] text-[#1b5e20] text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">Batting Stats</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Matches"     value={stats.matches}  accent="#3b82f6" editMode={editMode} onChange={setStat("matches")} />
                <StatCard label="Runs"        value={stats.runs}     accent="#10b981" editMode={editMode} onChange={setStat("runs")} />
                <StatCard label="Wickets"     value={stats.wickets}  accent="#f4b942" editMode={editMode} onChange={setStat("wickets")} />
                <StatCard label="Strike Rate" value={strikeRate}     accent="#8b5cf6" editMode={false}    onChange={() => {}} />
              </div>
            </div>
          )}

          {/* Bowling Stats */}
          {isBowler && (
            <div className="mb-5">
              <span className="inline-block bg-[#e8f5e9] text-[#1b5e20] text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">Bowling Stats</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Wickets"       value={stats.wickets}      accent="#3b82f6" editMode={editMode} onChange={setStat("wickets")} />
                <StatCard label="Overs Bowled"  value={stats.oversBowled}  accent="#10b981" editMode={editMode} onChange={setStat("oversBowled")} />
                <StatCard label="Runs Conceded" value={stats.runsConceded} accent="#f4b942" editMode={editMode} onChange={setStat("runsConceded")} />
                <StatCard label="Economy"       value={economy}            accent="#ec4899" editMode={false}    onChange={() => {}} />
              </div>
            </div>
          )}
          <PlayerRatingsPanel playerId={JSON.parse(localStorage.getItem("user") || "{}")._id} />

          {/* About */}
          <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: "1.5px solid #e8edf2" }}>
            <div className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#0a1628" }}>📖 About Me</div>
            {editMode ? (
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={5} className={`${inputCls} resize-none`} />
            ) : (
              <div className="rounded-xl px-4 py-3 text-sm text-[#374151] leading-relaxed" style={{ background: "#f8fafc", border: "1.5px solid #e8edf2" }}>
                {about || "No information added yet. Click Edit Profile to add your story."}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { icon: "📅", title: "My Bookings",  desc: "View and manage your bookings",  path: "/BookingRequests" },
              { icon: "🏆", title: "Tournaments",   desc: "Browse and join tournaments",    path: "/Tournaments" },
              { icon: "💬", title: "Messages",      desc: "Chat with owners and teams",     path: "/messages" },
              { icon: "🔍", title: "Find Players",  desc: "Discover players in your area", path: "/FindPlayers" },
            ].map(({ icon, title, desc, path }) => (
              <div key={title} className="quick-card bg-white rounded-2xl p-5 cursor-pointer transition-all duration-200"
                style={{ border: "1.5px solid #e8edf2" }} onClick={() => navigate(path)}>
                <div className="text-3xl mb-2.5">{icon}</div>
                <div className="font-bold text-sm text-[#0a1628] mb-1">{title}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: "1.5px solid #e8edf2" }}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="text-xl flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#0a1628" }}>
                📅 Availability — Next 10 Days
              </div>
              {editMode && <span className="text-xs text-[#607080]">Toggle to update availability</span>}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {next10Days.map((date, i) => {
                const avail = availability[i];
                return (
                  <div key={i} className="rounded-xl py-3 px-1 text-center transition-colors"
                    style={{ border: `1.5px solid ${avail ? "#a7f3d0" : "#e8edf2"}`, background: avail ? "#f0fdf4" : "#f8fafc" }}>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div className="text-2xl text-[#0a1628] my-0.5 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{date.getDate()}</div>
                    <div className="text-[9px] text-gray-400">{date.toLocaleDateString("en-US", { month: "short" })}</div>
                    <div className="mt-2">
                      {editMode ? (
                        <input type="checkbox" checked={!!avail} onChange={(e) => {
                          setAvailability(prev => { const u = [...prev]; u[i] = e.target.checked; return u; });
                        }} className="w-4 h-4 cursor-pointer accent-[#f4b942]" />
                      ) : (
                        <span className="text-[10px] font-bold" style={{ color: avail ? "#059669" : "#9ca3af" }}>
                          {avail ? "✓" : "✗"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SETTINGS ── */}
          <SettingsPanel
            onChangePassword={() => setShowChangePw(true)}
            onDeleteAccount={() => setShowDeleteAcc(true)}
            onLogout={userLogout}
          />

        </div>
      </div>
    </>
  );
}