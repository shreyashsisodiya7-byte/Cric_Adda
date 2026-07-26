import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL, UPLOADS_URL } from "../api";
import TournamentChat from "../components/TournamentChat";
import PlayerRatingModal from "../components/PlayerRatingModal";
import { MessageSquare } from "lucide-react";
import { toast } from "react-toastify";

// Google Fonts
const fontLink = document.createElement("link");
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector(`link[href="${fontLink.href}"]`))
  document.head.appendChild(fontLink);

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  "Batsman", "Bowler", "All-Rounder", "Wicket-Keeper",
  "Opening Batsman", "Pace Bowler", "Spin Bowler",
];
const FORMATS    = ["T20", "ODI", "Test", "T10", "Box Cricket"];
const MATCH_TYPES = ["League", "Knockout", "League + Knockout", "Round Robin"];
const PITCH_TYPES = ["Turf", "Concrete", "Artificial", "Matting", "Indoor"];
const WIZARD_STEPS = ["Basics", "Details", "Requirements", "Squad", "Review"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPlayerRating = (stats) => {
  if (!stats) return 0;
  const m = Number(stats.matches) || 0;
  if (m === 0) return 0;
  const score =
    Math.min((Number(stats.runs) || 0) / m / 30, 1) * 0.5 +
    Math.min((Number(stats.wickets) || 0) / m / 2, 1) * 0.35 +
    Math.min(m / 40, 1) * 0.15;
  return Math.round(score * 5 * 10) / 10;
};

const photoUrl = (p) =>
  p ? (p.startsWith("http") ? p : `${UPLOADS_URL}/${p}`) : null;

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "";

const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

/** Returns tomorrow's date as yyyy-mm-dd (start date cannot be today or earlier) */
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const fmtDate = (ds) => {
  if (!ds) return "—";
  return new Date(ds + "T00:00:00").toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const FORMAT_COLORS = {
  T20:          { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  ODI:          { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
  Test:         { bg: "#ede9fe", text: "#5b21b6", border: "#ddd6fe" },
  T10:          { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
  "Box Cricket":{ bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
};
const STATUS_COLORS = {
  upcoming:  { bg: "#d1fae5", text: "#065f46",  label: "Open"      },
  ongoing:   { bg: "#dbeafe", text: "#1e40af",  label: "Ongoing"   },
  completed: { bg: "#f1f5f9", text: "#475569",  label: "Completed" },
  cancelled: { bg: "#fee2e2", text: "#991b1b",  label: "Cancelled" },
};

// ── Shared input styles (dark wizard) ─────────────────────────────────────────
const wi = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition";
const wl = "text-xs text-slate-400 font-medium mb-1.5 block";
const ws = `${wi} cursor-pointer`;
const wh = "text-[11px] text-slate-500 mt-1";

// ─────────────────────────────────────────────────────────────────────────────
// Wizard sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ photo, name, size = 36 }) {
  const url = photoUrl(photo);
  const s = { width: size, height: size, borderRadius: "50%", flexShrink: 0 };
  return url ? (
    <img src={url} alt={name} style={{ ...s, objectFit: "cover", border: "2px solid #e8edf2" }} />
  ) : (
    <div style={{
      ...s, background: "#0a1628", color: "#f4b942",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.4,
      border: "2px solid #e8edf2",
    }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

// ── Step Bar ──────────────────────────────────────────────────────────────────
function StepBar({ current, steps }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
              i < current
                ? "bg-emerald-500 border-emerald-500 text-white"
                : i === current
                ? "bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                : "bg-white/5 border-white/15 text-slate-500"
            }`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-[9px] mt-1 font-medium whitespace-nowrap ${
              i === current ? "text-emerald-400" : i < current ? "text-emerald-600" : "text-slate-600"
            }`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 mx-0.5 transition-all duration-500 ${
              i < current ? "bg-emerald-500" : "bg-white/10"
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Banner Upload ─────────────────────────────────────────────────────────────
function BannerUpload({ banner, setBanner, setBannerFile }) {
  const fileRef = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBanner(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div
      onClick={() => fileRef.current?.click()}
      className={`relative w-full h-36 rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all group ${
        banner
          ? "border-emerald-500/40"
          : "border-white/15 bg-white/3 hover:border-emerald-500/50 hover:bg-white/5"
      }`}
    >
      {banner ? (
        <>
          <img src={banner} alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-xl">🔄 Change Banner</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">🖼️</div>
          <p className="text-slate-300 text-xs font-medium">Upload Tournament Banner / Poster</p>
          <p className="text-slate-500 text-[10px]">PNG, JPG, WEBP · Recommended 1200×400</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Role Requirements ─────────────────────────────────────────────────────────
function RoleRequirements({ requirements, setRequirements }) {
  const updateRole = (role, field, value) =>
    setRequirements((prev) => ({ ...prev, [role]: { ...(prev[role] || {}), [field]: value } }));

  const toggleRole = (role) =>
    setRequirements((prev) => {
      const next = { ...prev };
      if (next[role]) delete next[role];
      else next[role] = { min: 1, max: 3, description: "" };
      return next;
    });

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Tap a role to add it</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {ROLES.map((role) => (
          <button key={role} type="button" onClick={() => toggleRole(role)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              requirements[role]
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
            }`}>
            {role} {requirements[role] ? "✓" : "+"}
          </button>
        ))}
      </div>
      {Object.keys(requirements).length > 0 && (
        <div className="space-y-3">
          {Object.entries(requirements).map(([role, data]) => (
            <div key={role} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium text-sm">🏏 {role}</span>
                <button type="button" onClick={() => toggleRole(role)} className="text-red-400 text-xs hover:text-red-300 transition">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Min players</label>
                  <input type="number" min={1} max={15} value={data.min || 1}
                    onChange={(e) => updateRole(role, "min", parseInt(e.target.value) || 1)}
                    className={wi} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Max players</label>
                  <input type="number" min={1} max={15} value={data.max || 3}
                    onChange={(e) => updateRole(role, "max", parseInt(e.target.value) || 3)}
                    className={wi} />
                </div>
              </div>
              <input placeholder="Skill requirements, notes… (optional)"
                value={data.description || ""}
                onChange={(e) => updateRole(role, "description", e.target.value)}
                className={wi} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Squad Builder ─────────────────────────────────────────────────────────────
function SquadBuilder({ squad, setSquad, maxSize, requirements, token }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchPlayers = async (q) => {
    if (!q.trim()) return setSearchResults([]);
    setSearching(true);
    try {
      const res = await axios.get(`${API_URL}/players/search?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data.players || res.data.data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => searchPlayers(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addPlayer = (player, isSubstitute = false) => {
    if (squad.some((s) => s._id === player._id)) return;
    setSquad((prev) => [
      ...prev,
      {
        ...player, isSubstitute,
        jerseyNumber: isSubstitute ? null : prev.filter((p) => !p.isSubstitute).length + 1,
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removePlayer = (id) => setSquad((prev) => prev.filter((p) => p._id !== id));
  const toggleSub    = (id) => setSquad((prev) => prev.map((p) => p._id === id ? { ...p, isSubstitute: !p.isSubstitute } : p));

  const mainSquad   = squad.filter((p) => !p.isSubstitute);
  const substitutes = squad.filter((p) => p.isSubstitute);

  const roleCoverage = {};
  Object.entries(requirements).forEach(([role, data]) => {
    const count = squad.filter((p) => p.role === role || p.playerRole === role).length;
    roleCoverage[role] = { count, min: data.min, max: data.max, ok: count >= data.min };
  });

  return (
    <div className="space-y-4">
      {Object.keys(requirements).length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-3">Role Coverage</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(roleCoverage).map(([role, info]) => (
              <div key={role} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
                info.ok ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
              }`}>
                <span className={info.ok ? "text-emerald-400" : "text-amber-400"}>{info.ok ? "✓" : "⚠"}</span>
                <span className={info.ok ? "text-emerald-300" : "text-amber-300"}>{role}</span>
                <span className="ml-auto font-bold text-white">{info.count}/{info.min}+</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search players by name or city…" className={wi} />
        {(searching || searchResults.length > 0) && (
          <div className="absolute top-full mt-2 w-full bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-20 overflow-hidden max-h-52 overflow-y-auto">
            {searching && <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2"><span className="animate-spin">⏳</span> Searching…</div>}
            {searchResults.map((p) => {
              const already = squad.some((s) => s._id === p._id);
              return (
                <div key={p._id} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0 ${already ? "opacity-50" : "cursor-pointer"}`}>
                  <Avatar photo={p.photo} name={p.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.name}</p>
                    <p className="text-slate-500 text-xs">{p.role || p.playerRole || "Player"}{p.city ? ` · ${p.city}` : ""}</p>
                  </div>
                  {!already ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => addPlayer(p, false)} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition">+ Main</button>
                      <button onClick={() => addPlayer(p, true)}  className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20  text-amber-400  border border-amber-500/30  hover:bg-amber-500/30  transition">+ Sub</button>
                    </div>
                  ) : <span className="text-xs text-slate-600">Added</span>}
                </div>
              );
            })}
            {!searching && searchResults.length === 0 && searchQuery && (
              <div className="px-4 py-3 text-sm text-slate-500">No players found for "{searchQuery}"</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{mainSquad.length} main · {substitutes.length} subs · {squad.length}/{maxSize} total</span>
        <div className="flex h-1.5 flex-1 mx-3 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
            style={{ width: `${Math.min((squad.length / maxSize) * 100, 100)}%` }} />
        </div>
        <span className={`font-bold ${squad.length >= maxSize ? "text-red-400" : "text-emerald-400"}`}>{maxSize - squad.length} left</span>
      </div>

      {mainSquad.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">🏏 Main Squad ({mainSquad.length})</p>
          <div className="space-y-2">
            {mainSquad.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 group hover:border-emerald-500/20 transition">
                <span className="text-xs text-slate-500 font-bold w-5 text-center">{i + 1}</span>
                <Avatar photo={p.photo} name={p.name} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{p.name}</p>
                  <p className="text-slate-500 text-xs">{p.role || p.playerRole || "Player"}</p>
                </div>
                <button onClick={() => toggleSub(p._id)} className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 transition">→ Sub</button>
                <button onClick={() => removePlayer(p._id)} className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 transition">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {substitutes.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">🔄 Substitutes ({substitutes.length})</p>
          <div className="space-y-2">
            {substitutes.map((p) => (
              <div key={p._id} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3 group hover:border-amber-500/30 transition">
                <span className="text-xs text-amber-600">SUB</span>
                <Avatar photo={p.photo} name={p.name} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{p.name}</p>
                  <p className="text-amber-600 text-xs">{p.role || p.playerRole || "Player"}</p>
                </div>
                <button onClick={() => toggleSub(p._id)} className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 transition">→ Main</button>
                <button onClick={() => removePlayer(p._id)} className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 transition">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {squad.length === 0 && (
        <div className="text-center py-8 text-slate-600">
          <p className="text-3xl mb-2">🏏</p>
          <p className="text-sm">Search and add players to build your squad</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── CREATE TOURNAMENT WIZARD MODAL ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function CreateTournamentModal({ onClose, onCreated, user, token }) {
  const [step, setStep]           = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Banner
  const [banner, setBanner]           = useState("");
  const [bannerFile, setBannerFile]   = useState(null);

  // Requirements & Squad
  const [requirements, setRequirements] = useState({});
  const [squad, setSquad]               = useState([]);

  // Form
  const [form, setForm] = useState({
    name: "", description: "", format: "T20",
    matchType: "League + Knockout", location: "",
    city: user?.city || "", pitchType: "Turf",
    startDate: "", endDate: "", registrationDeadline: "",
    prizePool: "", runnerUpPrize: "", momPrize: "", mosPrize: "",
    entryFee: 0, maxTeams: 8, maxSquadSize: 15,
    ageGroup: "", gender: "Open", rules: "", contactInfo: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Date handlers with cascade validation ─────────────────────────────────
  const handleRegistrationDeadline = (value) => {
    setForm((f) => {
      const next = { ...f, registrationDeadline: value };
      if (next.startDate && next.startDate <= value) { next.startDate = ""; next.endDate = ""; }
      if (!next.startDate) next.endDate = "";
      return next;
    });
    setError("");
  };

  const handleStartDate = (value) => {
    setForm((f) => {
      const next = { ...f, startDate: value };
      if (next.endDate && next.endDate < addDays(value, 3)) next.endDate = "";
      return next;
    });
    if (value && value < tomorrow()) {
      setError("Start date must be a future date (not today or in the past).");
    } else if (form.registrationDeadline && value && value <= form.registrationDeadline) {
      setError(`Start date must be after the registration deadline (${fmtDate(form.registrationDeadline)}).`);
    } else {
      setError("");
    }
  };

  const handleEndDate = (value) => {
    if (form.startDate && value && value < addDays(form.startDate, 3)) {
      setError(`End date must be at least 3 days after start date (${fmtDate(form.startDate)}).`);
    } else {
      setError("");
    }
    setForm((f) => ({ ...f, endDate: value }));
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const validate = () => {
    if (step === 0) {
      if (!form.name.trim())     return "Tournament name is required.";
      if (!form.location.trim()) return "Venue / Location is required.";
      if (!form.city.trim())     return "City is required.";
      if (!form.startDate)       return "Start date is required.";
      if (form.startDate < tomorrow()) return "Start date must be a future date (not today or in the past).";
    }
    if (step === 1) {
      if (form.registrationDeadline && form.startDate && form.startDate <= form.registrationDeadline)
        return `Start date must be after the registration deadline (${fmtDate(form.registrationDeadline)}).`;
      if (form.endDate && form.startDate && form.endDate < addDays(form.startDate, 3))
        return `End date must be at least 3 days after start date (${fmtDate(form.startDate)}).`;
    }
    return null;
  };

  const nextStep = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const prevStep = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user?._id || !user?.name) {
      toast.error("You must be logged in to create a tournament.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        ownerId:            user._id,
        ownerName:          user.name,
        playerRequirements: requirements,
      };

      let res;
      if (bannerFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v === null || v === undefined) return;
          fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
        });
        fd.append("banner", bannerFile);
        res = await axios.post(`${API_URL}/tournaments`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.post(`${API_URL}/tournaments`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (res.data.success) {
        const newT = res.data.tournament;
        // Bulk add squad if any
        if (squad.length > 0) {
          try {
            await axios.post(
              `${API_URL}/tournaments/${newT._id}/squad/bulk`,
              {
                players: squad.map((p) => ({
                  playerId:     p._id,
                  playerName:   p.name,
                  playerRole:   p.role || p.playerRole,
                  playerPhoto:  p.photo,
                  isSubstitute: p.isSubstitute || false,
                })),
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (_) { /* squad bulk add optional */ }
        }
        toast.success("🏆 Tournament created successfully!");
        onCreated(newT);
        onClose();
      } else {
        setError(res.data.message || "Failed to create tournament.");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div
        className="relative w-full sm:max-w-2xl bg-linear-to-b from-[#0d1117] to-[#080b0f] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">🏆</div>
              <div>
                <h2 className="text-lg font-bold text-white">Create Tournament</h2>
                <p className="text-slate-500 text-xs">Set up your cricket tournament</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition">✕</button>
          </div>
          <StepBar current={step} steps={WIZARD_STEPS} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          {/* ── STEP 0: Basics ── */}
          {step === 0 && (
            <div className="space-y-4">
              <BannerUpload banner={banner} setBanner={setBanner} setBannerFile={setBannerFile} />

              <div>
                <label className={wl}>Start Date *</label>
                <input type="date" value={form.startDate}
                  min={form.registrationDeadline ? addDays(form.registrationDeadline, 1) : tomorrow()}
                  onChange={(e) => handleStartDate(e.target.value)} className={wi} />
                {form.registrationDeadline && (
                  <p className={wh}>Must be after reg. deadline ({fmtDate(form.registrationDeadline)})</p>
                )}
              </div>

              <div>
                <label className={wl}>Tournament Name *</label>
                <input value={form.name} onChange={set("name")} placeholder="Inter-City T20 Championship 2025" className={wi} />
              </div>

              <div>
                <label className={wl}>Description</label>
                <textarea value={form.description} onChange={set("description")} placeholder="Tell players what makes your tournament special…" rows={3} className={`${wi} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={wl}>Format *</label>
                  <select value={form.format} onChange={set("format")} className={ws}>
                    {FORMATS.map((f) => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={wl}>Match Type</label>
                  <select value={form.matchType} onChange={set("matchType")} className={ws}>
                    {MATCH_TYPES.map((f) => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={wl}>City *</label>
                  <input value={form.city} onChange={set("city")} placeholder="Bhopal" className={wi} />
                </div>
                <div>
                  <label className={wl}>Pitch Type</label>
                  <select value={form.pitchType} onChange={set("pitchType")} className={ws}>
                    {PITCH_TYPES.map((f) => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={wl}>Venue / Ground *</label>
                <input value={form.location} onChange={set("location")} placeholder="BSCA Cricket Ground, Kolar Road" className={wi} />
              </div>
            </div>
          )}

          {/* ── STEP 1: Details ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-base font-bold text-white mb-1">Schedule & Prizes</p>
                <p className="text-slate-500 text-xs">Dates, entry fees, and prize details</p>
              </div>

              {/* Dates with cascade validation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={wl}>Registration Deadline</label>
                  <input type="date" value={form.registrationDeadline}
                    onChange={(e) => handleRegistrationDeadline(e.target.value)} className={wi} />
                  <p className={wh}>Teams must register by this date</p>
                </div>
                <div>
                  <label className={wl}>Start Date *</label>
                  <input type="date" value={form.startDate}
                    min={form.registrationDeadline ? addDays(form.registrationDeadline, 1) : tomorrow()}
                    onChange={(e) => handleStartDate(e.target.value)} className={wi} />
                  {form.registrationDeadline && <p className={wh}>After {fmtDate(form.registrationDeadline)}</p>}
                </div>
                <div>
                  <label className={wl}>End Date</label>
                  <input type="date" value={form.endDate}
                    min={form.startDate ? addDays(form.startDate, 3) : ""}
                    onChange={(e) => handleEndDate(e.target.value)} className={wi} />
                  {form.startDate && <p className={wh}>Min 3 days after {fmtDate(form.startDate)}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={wl}>Entry Fee (₹)</label>
                  <input type="number" min={0} value={form.entryFee} onChange={set("entryFee")} className={wi} />
                </div>
                <div>
                  <label className={wl}>Max Teams</label>
                  <input type="number" min={2} max={64} value={form.maxTeams} onChange={set("maxTeams")} className={wi} />
                </div>
                <div>
                  <label className={wl}>Squad Size per Team</label>
                  <input type="number" min={5} max={25} value={form.maxSquadSize} onChange={set("maxSquadSize")} className={wi} />
                </div>
              </div>

              {/* Prizes */}
              <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4">
                <p className="text-xs text-yellow-400 font-semibold uppercase tracking-widest mb-4">🏅 Prize Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={wl}>🥇 Winner Prize Pool</label>
                    <input value={form.prizePool} onChange={set("prizePool")} placeholder="e.g. ₹50,000 + Trophy" className={wi} />
                  </div>
                  <div>
                    <label className={wl}>🥈 Runner-Up Prize</label>
                    <input value={form.runnerUpPrize} onChange={set("runnerUpPrize")} placeholder="₹25,000" className={wi} />
                  </div>
                  <div>
                    <label className={wl}>⭐ Man of the Match</label>
                    <input value={form.momPrize} onChange={set("momPrize")} placeholder="₹2,000 per game" className={wi} />
                  </div>
                  <div>
                    <label className={wl}>🎖 Man of the Series</label>
                    <input value={form.mosPrize} onChange={set("mosPrize")} placeholder="₹10,000 + Medal" className={wi} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={wl}>Age Group</label>
                  <input value={form.ageGroup} onChange={set("ageGroup")} placeholder="e.g. U-19, Open, 35+" className={wi} />
                </div>
                <div>
                  <label className={wl}>Gender</label>
                  <select value={form.gender} onChange={set("gender")} className={ws}>
                    {["Open", "Men", "Women", "Mixed"].map((g) => <option key={g} value={g} className="bg-slate-900">{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={wl}>📜 Tournament Rules</label>
                <textarea value={form.rules} onChange={set("rules")} placeholder="DRS rules, powerplay rules, dress code, fair play policy…" rows={3} className={`${wi} resize-none`} />
              </div>

              <div>
                <label className={wl}>📞 Contact Info</label>
                <input value={form.contactInfo} onChange={set("contactInfo")} placeholder="Phone number, WhatsApp, Instagram handle…" className={wi} />
              </div>
            </div>
          )}

          {/* ── STEP 2: Requirements ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-base font-bold text-white mb-1">Player Requirements</p>
                <p className="text-slate-500 text-xs">Define role slots so players know what you need</p>
              </div>
              <RoleRequirements requirements={requirements} setRequirements={setRequirements} />
              {Object.keys(requirements).length === 0 && (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
                  <p className="text-slate-500 text-sm">💡 No requirements set — all roles can join freely</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Squad ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-base font-bold text-white mb-1">Build Your Squad</p>
                <p className="text-slate-500 text-xs">Add up to {form.maxSquadSize} players (including substitutes)</p>
              </div>
              <SquadBuilder squad={squad} setSquad={setSquad} maxSize={form.maxSquadSize} requirements={requirements} token={token} />
            </div>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <p className="text-base font-bold text-white mb-1">Review & Publish</p>
                <p className="text-slate-500 text-xs">Everything look good? Let's go live! 🚀</p>
              </div>

              {banner && (
                <div className="h-28 rounded-2xl overflow-hidden border border-white/10">
                  <img src={banner} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center text-xl">🏆</div>
                  <div>
                    <p className="text-white font-bold">{form.name || "Unnamed Tournament"}</p>
                    <p className="text-slate-400 text-xs">{form.format} · {form.matchType} · {form.city}</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Venue",       value: form.location },
                    { label: "Start",       value: fmtDate(form.startDate) },
                    form.endDate && { label: "End", value: fmtDate(form.endDate) },
                    form.registrationDeadline && { label: "Reg. Deadline", value: fmtDate(form.registrationDeadline) },
                    { label: "Entry",       value: form.entryFee > 0 ? `₹${form.entryFee}` : "Free" },
                    { label: "Max Teams",   value: form.maxTeams },
                    { label: "Squad Size",  value: form.maxSquadSize },
                    form.prizePool && { label: "🥇 Winner", value: form.prizePool },
                    form.runnerUpPrize && { label: "🥈 Runner", value: form.runnerUpPrize },
                    form.momPrize && { label: "⭐ MOM", value: form.momPrize },
                    form.mosPrize && { label: "🎖 MOS", value: form.mosPrize },
                  ].filter(Boolean).map(({ label, value }) => (
                    <div key={label}>
                      <span className="text-slate-500">{label}: </span>
                      <span className="text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(requirements).length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">📌 Role Requirements</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(requirements).map(([role, data]) => (
                      <span key={role} className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 rounded-xl px-3 py-1.5 text-xs font-medium">
                        {role}: {data.min}–{data.max}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">🏏 Initial Squad</p>
                <p className="text-slate-300 text-sm">
                  {squad.filter((p) => !p.isSubstitute).length} main players · {squad.filter((p) => p.isSubstitute).length} substitutes
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={prevStep} disabled={step === 0}
            className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
            ← Back
          </button>

          <div className="flex items-center gap-1.5">
            {WIZARD_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-emerald-400" : i < step ? "w-2.5 bg-emerald-700" : "w-2.5 bg-white/15"
              }`} />
            ))}
          </div>

          {step < WIZARD_STEPS.length - 1 ? (
            <button onClick={nextStep}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-emerald-500/20">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              {loading ? <><span className="animate-spin">⏳</span> Publishing…</> : <>🚀 Publish Tournament</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── JOIN REQUEST MODAL ────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function JoinRequestModal({ tournament, onClose, onRequested, user }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleSubmit = async () => {
    const playerId   = user?._id || user?.id;
    const playerName = user?.name || user?.Fullname;
    if (!playerId || !playerName) {
      toast.error("⚠️ User session is invalid. Please log out and log in again.");
      return;
    }
    setLoading(true);
    try {
      let playerRole = "", playerCity = "", playerPhoto = "", playerStats = {};
      try {
        const pRes = await axios.get(`${API_URL}/players/profile/${playerId}`, { headers: { Authorization: `Bearer ${token}` } });
        const p = pRes.data.data;
        if (p) { playerRole = p.role || ""; playerCity = p.city || ""; playerPhoto = p.photo || ""; playerStats = p.stats || {}; }
      } catch (_) {}
      const res = await axios.post(
        `${API_URL}/tournaments/${tournament._id}/join`,
        { playerId, playerName, playerRole, playerCity, playerPhoto, playerStats, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("🏏 Join request sent successfully!", { toastId: "join-sent" });
        onRequested();
        onClose();
      } else {
        toast.error("❌ " + (res.data.message || "Failed to send request."));
      }
    } catch (e) {
      toast.error("❌ " + (e.response?.data?.message || "Server error."));
    } finally {
      setLoading(false);
    }
  };

  const fc = FORMAT_COLORS[tournament.format] || FORMAT_COLORS.T20;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a1628]/75 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)] font-sans" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-[Bebas_Neue] text-[24px] text-[#0a1628]">Request to Join</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-[#e8edf2] bg-[#f8fafc] text-[#607080] text-sm hover:bg-[#f4f7fb]">✕</button>
        </div>
        <div className="bg-[#f8fafc] border border-[#e8edf2] rounded-xl p-4 mb-4">
          <div className="font-semibold text-[#0a1628] text-[15px]">{tournament.name}</div>
          <div className="text-sm text-[#607080] mt-1">📍 {tournament.location}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ background: fc.bg, color: fc.text, borderColor: fc.border }}>{tournament.format}</span>
            <span className="text-xs text-[#607080]">📅 {fmt(tournament.startDate)}</span>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs font-semibold text-[#607080] uppercase tracking-wide mb-2">Message to organiser (optional)</p>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell the organiser why you want to join…" rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400" />
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className={`w-full rounded-lg py-3 font-bold text-[#0a1628] transition ${loading ? "bg-[#607080] cursor-not-allowed" : "bg-[#f4b942] hover:scale-[1.02]"}`}>
          {loading ? "Sending…" : "🏏 Send Join Request"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TOURNAMENT DETAIL MODAL ───────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function TournamentDetailModal({ tournament: init, onClose, user, token, isOwner, onOpenChat, onOpenRating }) {
  const [tournament, setTournament] = useState(init);
  const [tab, setTab]               = useState(isOwner ? "requests" : "squad");
  const [loading, setLoading]       = useState(false);

  const refresh = async () => {
    try {
      const res = await axios.get(`${API_URL}/tournaments/${tournament._id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setTournament(res.data.tournament);
    } catch (_) {}
  };

  const approve = async (id) => {
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/tournaments/${tournament._id}/requests/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success("✅ Player added to squad!"); await refresh(); }
      else toast.error("❌ " + res.data.message);
    } catch (e) { toast.error("❌ " + (e.response?.data?.message || "Error approving request.")); }
    finally { setLoading(false); }
  };

  const reject = async (id) => {
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/tournaments/${tournament._id}/requests/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.info("🚫 Request rejected."); await refresh(); }
      else toast.error("❌ " + res.data.message);
    } catch (e) { toast.error("❌ " + (e.response?.data?.message || "Error rejecting request.")); }
    finally { setLoading(false); }
  };

  const removePlayer = async (squadPlayerId) => {
    if (!window.confirm("Remove this player from squad?")) return;
    const reason = window.prompt("Reason for removing this player (required):");
    if (reason === null) return;
    const trimmed = (reason || "").trim();
    if (!trimmed) { toast.error("⚠️ Removal reason is required."); return; }
    setLoading(true);
    try {
      const res = await axios.delete(`${API_URL}/tournaments/${tournament._id}/squad/${squadPlayerId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: trimmed },
      });
      if (res.data.success) { toast.success("🗑️ Player removed from squad."); await refresh(); }
      else toast.error("❌ " + (res.data.message || "Failed to remove player."));
    } catch (e) { toast.error("❌ " + (e.response?.data?.message || "Error removing player.")); }
    finally { setLoading(false); }
  };

  const pendingCount = (tournament.joinRequests || []).filter((r) => r.status === "pending").length;
  const sc = STATUS_COLORS[tournament.status] || STATUS_COLORS.upcoming;
  const fc = FORMAT_COLORS[tournament.format] || FORMAT_COLORS.T20;
  const squadPct = Math.min(((tournament.squad?.length || 0) / tournament.maxSquadSize) * 100, 100);
  const isInSquad = user && tournament.squad?.some((s) => s.playerId?.toString() === user._id?.toString());

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      border: tab === id ? "none" : "1.5px solid #e8edf2",
      background: tab === id ? "#0a1628" : "transparent",
      color: tab === id ? "#fff" : "#607080",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center", gap: 6,
    }}>{label}</button>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a1628c0] backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] max-h-[90vh] flex flex-col font-sans overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[#e8edf2]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#f4f7fb] text-[#607080]">{sc.label}</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ background: fc.bg, color: fc.text, borderColor: fc.border }}>{tournament.format}</span>
              </div>
              <div className="text-[24px] leading-tight font-[Bebas_Neue] text-[#0a1628]">{tournament.name}</div>
              <div className="text-sm text-[#607080] mt-1">📍 {tournament.location} · 👤 {tournament.ownerName}</div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full border border-[#e8edf2] bg-[#f8fafc] text-[#607080]">✕</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: `📅 ${fmt(tournament.startDate)}` },
              tournament.prizePool   && { label: `🏆 ${tournament.prizePool}`, gold: true },
              tournament.entryFee > 0 && { label: `💵 ₹${tournament.entryFee} entry`, green: true },
            ].filter(Boolean).map((p, i) => (
              <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium ${p.gold ? "bg-yellow-100 text-yellow-800" : p.green ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#f4f7fb] text-[#607080]"}`}>{p.label}</span>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#607080] mb-1">
              <span>Squad Progress</span>
              <span className="font-semibold text-[#0a1628]">{tournament.squad?.length || 0} / {tournament.maxSquadSize}</span>
            </div>
            <div className="h-1.5 bg-[#f4f7fb] rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${squadPct >= 100 ? "bg-green-500" : "bg-[#f4b942]"}`} style={{ width: `${squadPct}%` }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex flex-wrap gap-2">
          <TabBtn id="squad" label={`🏏 Squad (${tournament.squad?.length || 0})`} />
          {isOwner && (
            <TabBtn id="requests" label={
              <span className="flex items-center gap-2">
                📩 Requests
                {pendingCount > 0 && <span className="w-4 h-4 flex items-center justify-center text-[10px] bg-red-500 text-white rounded-full">{pendingCount}</span>}
              </span>
            } />
          )}
          <TabBtn id="info" label="ℹ️ Info" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">

          {/* SQUAD */}
          {tab === "squad" && (
            !tournament.squad?.length ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🏏</div>
                <div className="text-xl font-[Bebas_Neue] text-[#0a1628]">No Players Yet</div>
                <p className="text-sm mt-1">The squad is empty. Players can request to join.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {tournament.squad.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3 bg-[#f8fafc] border border-[#e8edf2] rounded-xl px-4 py-2">
                    <div className="w-7 h-7 rounded bg-[#0a1628] text-[#f4b942] flex items-center justify-center text-[12px] font-[Bebas_Neue]">{p.jerseyNumber || i + 1}</div>
                    <Avatar photo={p.playerPhoto} name={p.playerName} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#0a1628] truncate">{p.playerName}</div>
                      <div className="text-xs text-[#607080]">{p.playerRole || "Player"}</div>
                    </div>
                    {isOwner && (
                      <button onClick={() => removePlayer(p._id)} className="text-xs px-2 py-1 rounded border border-red-200 bg-red-100 text-red-700">Remove</button>
                    )}
                    {isOwner && (
                      <button onClick={() => { onClose(); onOpenRating({ tournament, player: p }); }} className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg">⭐ Rate</button>
                    )}
                    {(isOwner || isInSquad) && (
                      <button onClick={() => { if (isOwner) onClose(); onOpenChat(tournament); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f4b942]/10 hover:bg-[#f4b942]/20 border border-[#f4b942]/30 text-[#f4b942] text-xs font-medium">
                        <MessageSquare size={13} /> Chat
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* REQUESTS */}
          {tab === "requests" && isOwner && (
            !(tournament.joinRequests?.length) ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📩</div>
                <div className="font-[Bebas_Neue] text-2xl text-[#0a1628]">No Requests Yet</div>
                <p className="text-sm mt-1">Join requests from players will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tournament.joinRequests.map((r) => (
                  <div key={r._id} className={`border rounded-xl p-4 transition ${r.status === "approved" ? "border-green-200 bg-green-50" : r.status === "rejected" ? "border-red-200 bg-red-50 opacity-60" : "border-gray-200 bg-white"}`}>
                    <div className="flex items-center gap-3">
                      <Avatar photo={r.playerPhoto} name={r.playerName} size={38} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14px] text-[#0a1628] truncate">{r.playerName}</div>
                        <div className="text-xs text-gray-500">{r.playerRole || "Player"}{r.playerCity ? ` · ${r.playerCity}` : ""}</div>
                        {r.playerStats && <div className="text-xs text-gray-400 mt-1">⭐ {getPlayerRating(r.playerStats)}</div>}
                      </div>
                      <div className="shrink-0">
                        {r.status === "pending" ? (
                          <div className="flex gap-2">
                            <button onClick={() => approve(r._id)} disabled={loading} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0a1628] text-[#f4b942] disabled:opacity-50">✓ Approve</button>
                            <button onClick={() => reject(r._id)}  disabled={loading} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-600 bg-white disabled:opacity-50">✕ Reject</button>
                            {isOwner && (
                              <Link to={`/PlayerProfile/${r.playerId}`}>
                                <button className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#e8edf2] bg-white text-[#0a1628]">View Profile</button>
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.status === "approved" ? "bg-[#a7f3d0] text-[#065f46]" : "bg-red-200 text-red-700"}`}>
                            {r.status === "approved" ? "✓ Approved" : r.status === "removed" ? "Removed" : "✕ Rejected"}
                          </span>
                        )}
                      </div>
                    </div>
                    {r.message && (
                      <div className="mt-3 p-3 text-xs text-gray-600 italic bg-[#f4f7fb] border border-[#e8edf2] rounded-xl">"{r.message}"</div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* INFO */}
          {tab === "info" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Format",    value: tournament.format },
                { label: "City",      value: tournament.city },
                { label: "Start Date",value: fmt(tournament.startDate) },
                tournament.prizePool && { label: "Prize Pool", value: tournament.prizePool },
                { label: "Entry Fee", value: `₹${tournament.entryFee}` },
                { label: "Organiser", value: tournament.ownerName },
              ].filter(Boolean).map((item) => (
                <div key={item.label} className="bg-[#f8fafc] border border-[#e8edf2] rounded-lg p-3">
                  <div className="text-[11px] text-gray-400 uppercase">{item.label}</div>
                  <div className="text-sm font-semibold text-[#0a1628]">{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TOURNAMENT CARD ───────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const T_BG    = ["#fef3c7","#d1fae5","#ede9fe","#dbeafe","#fee2e2"];
const T_EMOJI = ["🏆","🎖️","⚡","🏅","🎯"];

function TournamentCard({ tournament, onClick, myRequestStatus, inSquad, index }) {
  const [hover, setHover] = useState(false);
  const sc = STATUS_COLORS[tournament.status] || STATUS_COLORS.upcoming;
  const fc = FORMAT_COLORS[tournament.format]  || FORMAT_COLORS.T20;
  const squadPct       = Math.min(((tournament.squad?.length || 0) / tournament.maxSquadSize) * 100, 100);
  const deadlinePassed = tournament.registrationDeadline && new Date() > new Date(tournament.registrationDeadline);
  const squadFull      = (tournament.squad?.length || 0) >= tournament.maxSquadSize;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff", borderRadius: 14,
        border: `1.5px solid ${hover ? "#f4b942" : "#e8edf2"}`,
        overflow: "hidden", cursor: "pointer",
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? "0 12px 32px rgba(0,0,0,0.1)" : "none",
        transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ height: 4, background: squadPct >= 100 ? "#10b981" : "#f4b942" }} />
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: T_BG[index % T_BG.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{T_EMOJI[index % T_EMOJI.length]}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: fc.bg, color: fc.text, border: `1px solid ${fc.border}` }}>{tournament.format}</span>
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#0a1628", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tournament.name}</div>
        <div style={{ fontSize: 12, color: "#607080", marginBottom: 10 }}>📍 {tournament.location}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
          <span>📅 {fmt(tournament.startDate)}</span>
          <span>👤 {tournament.ownerName}</span>
          {tournament.prizePool && <span style={{ color: "#92400e", fontWeight: 600 }}>🏅 {tournament.prizePool}</span>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
            <span>Squad</span>
            <span style={{ fontWeight: 600, color: "#0a1628" }}>{tournament.squad?.length || 0}/{tournament.maxSquadSize}</span>
          </div>
          <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${squadPct}%`, background: squadPct >= 100 ? "#10b981" : "#f4b942", borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {inSquad && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#d1fae5", color: "#065f46" }}>✓ In Squad</span>}
            {!inSquad && myRequestStatus === "pending"  && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fef3c7", color: "#92400e" }}>⏳ Pending</span>}
            {!inSquad && myRequestStatus === "rejected" && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fee2e2", color: "#991b1b" }}>✕ Not Selected</span>}
            {squadFull && !inSquad && !myRequestStatus && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f1f5f9", color: "#64748b" }}>Squad Full</span>}
            {deadlinePassed && !inSquad && !myRequestStatus && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f1f5f9", color: "#64748b" }}>Deadline Passed</span>}
          </div>
          <span style={{ fontSize: 11, color: hover ? "#f4b942" : "#9ca3af", fontWeight: 600, transition: "color 0.2s" }}>Details →</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function Tournaments() {
  const [tournaments,   setTournaments]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [filterFormat,  setFilterFormat]  = useState("all");
  const [activeView,    setActiveView]    = useState("all");
  const [showCreate,    setShowCreate]    = useState(false);
  const [joinTarget,    setJoinTarget]    = useState(null);
  const [detailTarget,  setDetailTarget]  = useState(null);
  const [chatTournament,setChatTournament]= useState(null);
  const [ratingTarget,  setRatingTarget]  = useState(null);

  const token    = localStorage.getItem("token");
  const userRaw  = localStorage.getItem("user");
  const userParsed = userRaw ? JSON.parse(userRaw) : null;
  const user     = userParsed ? {
    _id:  userParsed._id,
    name: userParsed.Fullname || userParsed.name || "",
    city: userParsed.city || "",
  } : null;
  const userType = userParsed?.userType || localStorage.getItem("userType") || "Player";
  const isOwner  = userType === "Owner";

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)                     params.search = search;
      if (filterStatus !== "all")     params.status = filterStatus;
      if (filterFormat !== "all")     params.format = filterFormat;
      const res = await axios.get(`${API_URL}/tournaments`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data.success) setTournaments(res.data.tournaments || []);
      else toast.error("⚠️ Failed to load tournaments.", { toastId: "fetch-error" });
    } catch (e) {
      toast.error("🔌 " + (e.response?.data?.message || "Could not connect to server."), { toastId: "fetch-error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTournaments(); }, [filterStatus, filterFormat]);

  const visibleTournaments = tournaments.filter((t) => {
    if (activeView === "mine" && user) return t.ownerId === user._id;
    if (activeView === "my-requests" && user)
      return t.joinRequests?.some((r) => r.playerId === user._id) || t.squad?.some((s) => s.playerId === user._id);
    return true;
  });

  const getMyStatus = (t) =>
    !user ? null : t.joinRequests?.find((r) => r.playerId?.toString() === user._id?.toString())?.status || null;

  const amInSquad = (t) =>
    user ? t.squad?.some((s) => s.playerId?.toString() === user._id?.toString()) : false;

  const canJoin = (t) => {
    if (!user || !token || isOwner || amInSquad(t)) return false;
    const s = getMyStatus(t);
    if (s === "pending" || s === "approved") return false;
    if (["completed", "cancelled"].includes(t.status)) return false;
    if ((t.squad?.length || 0) >= t.maxSquadSize) return false;
    if (t.registrationDeadline && new Date() > new Date(t.registrationDeadline)) return false;
    return true;
  };

  const upcomingCount = tournaments.filter((t) => t.status === "upcoming").length;
  const ongoingCount  = tournaments.filter((t) => t.status === "ongoing").length;

  const ViewTab = ({ id, label }) => (
    <button
      onClick={() => {
        setActiveView(id);
        toast.info(
          id === "all"          ? "📋 Showing all tournaments"    :
          id === "mine"         ? "👑 Showing your tournaments"   :
          "📩 Showing your join requests",
          { autoClose: 1200, toastId: `view-${id}` }
        );
      }}
      style={{
        padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        border: activeView === id ? "none" : "1.5px solid #e8edf2",
        background: activeView === id ? "#0a1628" : "transparent",
        color: activeView === id ? "#f4b942" : "#607080",
        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      }}
    >{label}</button>
  );

  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ minHeight: "100vh", background: "#f4f7fb", fontFamily: "'DM Sans', sans-serif", color: "#0a1628", paddingTop: 64 }}>

        {/* ── HERO ── */}
        <section className="bg-linear-to-br from-[#0a1628] via-[#1a3a5c] to-[#0f2d1e] text-center py-14 px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-[#f4b942] text-xs font-semibold tracking-[1.5px] px-4 py-1.5 rounded-full mb-5 uppercase">
            🏆 Cricket Tournaments Squads
          </div>
          <h1 className="text-white font-[Bebas_Neue] text-[clamp(36px,6vw,60px)] leading-none mb-3 tracking-widest">
            FIND & JOIN <br /><span className="text-[#f4b942]">TOURNAMENTS Squads</span>
          </h1>
          <p className="text-white/65 text-base max-w-md mx-auto mb-8">
            Browse cricket tournaments Squads across India. Request to join or Create your own.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {token ? (
              <button onClick={() => setShowCreate(true)} className="bg-[#f4b942] text-[#0a1628] font-bold px-7 py-3 rounded-lg">+ Create Squad</button>
            ) : (
              <button onClick={() => setActiveView("all")} className="bg-[#f4b942] text-[#0a1628] font-bold px-7 py-3 rounded-lg">Browse All</button>
            )}
            {token && !isOwner && (
              <button onClick={() => setActiveView("my-requests")} className="border border-white/40 text-white px-7 py-3 rounded-lg font-semibold">My Requests</button>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-10 mt-8">
            {[
              { num: tournaments.length,        label: "Total Tournaments"  },
              { num: upcomingCount,              label: "Upcoming"           },
              { num: ongoingCount,               label: "Ongoing"            },
              { num: visibleTournaments.length,  label: "Matching Filters"   },
            ].map((s, i) => (
              <div key={i} className="text-center flex items-center gap-10">
                {i > 0 && <div className="w-px h-9 bg-white/15" />}
                <div>
                  <div className="font-[Bebas_Neue] text-[#f4b942] text-3xl leading-none">{s.num}</div>
                  <div className="text-white/50 text-xs mt-1">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FILTER BAR ── */}
        <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 sticky top-16 z-10">
          <form onSubmit={(e) => { e.preventDefault(); fetchTournaments(); }} className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-40 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tournaments squad…"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#f4b942]" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
            <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="all">All Formats</option>
              {FORMATS.map((f) => <option key={f}>{f}</option>)}
            </select>
            <button type="submit" className="bg-[#f4b942] text-[#0a1628] font-bold px-5 py-2 rounded-lg text-sm">Search</button>
            {token && (
              <button type="button" onClick={() => setShowCreate(true)} className="bg-[#0a1628] text-[#f4b942] font-bold px-5 py-2 rounded-lg text-sm">+ Create</button>
            )}
          </form>
        </div>

        {/* ── CONTENT ── */}
        <div className="max-w-6xl mx-auto px-6 py-10">
          {token && (
            <div className="flex flex-wrap gap-2 mb-6">
              <ViewTab id="all"         label="All Tournaments squad" />
              <ViewTab id="mine"        label="My Tournaments"        />
              <ViewTab id="my-requests" label="My Requests"           />
            </div>
          )}

          {!loading && (
            <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
              <div>
                <div className="inline-block bg-[#d1fae5] text-[#065f46] text-xs font-semibold px-3 py-1 rounded-full">Tournaments Squad</div>
                <h2 className="font-[Bebas_Neue] text-3xl mt-2 text-[#0a1628]">
                  {visibleTournaments.length} Tournament Squad{visibleTournaments.length !== 1 ? "s" : ""} Found
                </h2>
              </div>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map((i) => <div key={i} className="h-60 bg-white border border-gray-200 rounded-lg animate-pulse" />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && visibleTournaments.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🏏</div>
              <h2 className="font-[Bebas_Neue] text-3xl mb-2 text-[#0a1628]">No Tournaments squad Found</h2>
              <p className="text-gray-500 mb-6">{activeView === "mine" ? "Create your first tournament above." : "Try adjusting your search filters."}</p>
              {token && (
                <button onClick={() => setShowCreate(true)} className="bg-[#f4b942] px-6 py-2 rounded-lg font-bold text-[#0a1628]">+ Create Tournament squad</button>
              )}
            </div>
          )}

          {/* Cards */}
          {!loading && visibleTournaments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleTournaments.map((t, i) => (
                <div key={t._id}>
                  <TournamentCard
                    tournament={t} index={i}
                    myRequestStatus={getMyStatus(t)}
                    inSquad={amInSquad(t)}
                    onClick={() => setDetailTarget(t)}
                  />
                  {!token ? (
                    t.status !== "completed" && t.status !== "cancelled" && (
                      <Link to="/Log_SignUp" className="mt-2 flex items-center justify-center gap-2 bg-[#f4f7fb] border border-[#e8edf2] rounded-xl py-2 text-sm font-semibold text-gray-600">
                        🔐 Login to Join
                      </Link>
                    )
                  ) : (
                    canJoin(t) && (
                      <button onClick={(e) => { e.stopPropagation(); setJoinTarget(t); }}
                        className="mt-2 w-full bg-[#0a1628] text-[#f4b942] py-2 rounded-lg font-bold text-sm">
                        🏏 Request to Join
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── MODALS ── */}
        {showCreate && user && (
          <CreateTournamentModal
            onClose={() => setShowCreate(false)}
            onCreated={(t) => setTournaments((p) => [t, ...p])}
            user={user}
            token={token}
          />
        )}
        {joinTarget && user && (
          <JoinRequestModal tournament={joinTarget} onClose={() => setJoinTarget(null)} onRequested={fetchTournaments} user={user} />
        )}
        {chatTournament && (
          <TournamentChat
            tournamentId={chatTournament._id} token={token}
            userId={user?._id} userName={user?.name}
            isOwner={chatTournament.ownerId?.toString() === user?._id?.toString()}
            squad={chatTournament.squad} onClose={() => setChatTournament(null)}
          />
        )}
        {ratingTarget && (
          <PlayerRatingModal
            tournamentId={ratingTarget.tournament._id}
            player={{ _id: ratingTarget.player.playerId, name: ratingTarget.player.playerName, photo: ratingTarget.player.playerPhoto, role: ratingTarget.player.playerRole }}
            isOwner={ratingTarget.tournament.ownerId === user?._id}
            token={token} userId={user?._id} userName={user?.name}
            onClose={() => setRatingTarget(null)}
            onSaved={async () => { await fetchTournaments(); toast.success("✓ Rating saved and UI refreshed"); setRatingTarget(null); }}
          />
        )}
        {detailTarget && (
          <TournamentDetailModal
            tournament={detailTarget} onClose={() => setDetailTarget(null)}
            user={user} token={token}
            isOwner={user && detailTarget.ownerId?.toString() === user._id?.toString()}
            onOpenChat={(t) => setChatTournament(t)}
            onOpenRating={(data) => setRatingTarget(data)}
          />
        )}
      </div>
    </>
  );
}