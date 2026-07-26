import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL, UPLOADS_URL } from "../api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const photoUrl = (p) =>
  p ? (p.startsWith("http") ? p : `${UPLOADS_URL}/${p}`) : null;

/** Add N days to a date string (yyyy-mm-dd) and return a new date string */
const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

/** Format a date string for display */
const fmtDate = (ds) => {
  if (!ds) return "—";
  return new Date(ds + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const ROLES = [
  "Batsman",
  "Bowler",
  "All-Rounder",
  "Wicket-Keeper",
  "Opening Batsman",
  "Pace Bowler",
  "Spin Bowler",
];
const FORMATS = ["T20", "ODI", "Test", "T10", "Box Cricket"];
const MATCH_TYPES = ["League", "Knockout", "League + Knockout", "Round Robin"];
const PITCH_TYPES = ["Turf", "Concrete", "Artificial", "Matting", "Indoor"];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ photo, name, size = "md" }) {
  const s =
    size === "xs"
      ? "w-6 h-6 text-[10px]"
      : size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
      ? "w-14 h-14 text-lg"
      : "w-10 h-10 text-sm";
  const url = photoUrl(photo);
  return url ? (
    <img
      src={url}
      alt={name}
      className={`${s} rounded-full object-cover border-2 border-white/10 flex-shrink-0`}
    />
  ) : (
    <div
      className={`${s} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold border-2 border-white/10 flex-shrink-0`}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepBar({ current, steps }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                i < current
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : i === current
                  ? "bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-white/5 border-white/15 text-slate-500"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                i === current
                  ? "text-emerald-400"
                  : i < current
                  ? "text-emerald-600"
                  : "text-slate-600"
              }`}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mb-4 mx-1 transition-all duration-500 ${
                i < current ? "bg-emerald-500" : "bg-white/10"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Banner Upload ────────────────────────────────────────────────────────────

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
      className={`relative w-full h-48 rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all group ${
        banner
          ? "border-emerald-500/40 bg-transparent"
          : "border-white/15 bg-white/3 hover:border-emerald-500/50 hover:bg-white/5"
      }`}
    >
      {banner ? (
        <>
          <img
            src={banner}
            alt="Tournament banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <span className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-xl">
              🔄 Change Banner
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">
            🖼️
          </div>
          <p className="text-slate-300 text-sm font-medium">
            Upload Tournament Banner / Poster
          </p>
          <p className="text-slate-500 text-xs">
            PNG, JPG, WEBP · Recommended 1200×400
          </p>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ─── Role Requirements Builder ────────────────────────────────────────────────

function RoleRequirements({ requirements, setRequirements }) {
  const updateRole = (role, field, value) => {
    setRequirements((prev) => ({
      ...prev,
      [role]: { ...(prev[role] || {}), [field]: value },
    }));
  };

  const toggleRole = (role) => {
    setRequirements((prev) => {
      const next = { ...prev };
      if (next[role]) delete next[role];
      else next[role] = { min: 1, max: 3, description: "" };
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
        Tap a role to add it
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => toggleRole(role)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              requirements[role]
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {role} {requirements[role] ? "✓" : "+"}
          </button>
        ))}
      </div>

      {Object.keys(requirements).length > 0 && (
        <div className="space-y-3">
          {Object.entries(requirements).map(([role, data]) => (
            <div
              key={role}
              className="bg-white/5 border border-white/10 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium text-sm">
                  🏏 {role}
                </span>
                <button
                  type="button"
                  onClick={() => toggleRole(role)}
                  className="text-red-400 text-xs hover:text-red-300 transition"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    Min players
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={data.min || 1}
                    onChange={(e) =>
                      updateRole(role, "min", parseInt(e.target.value) || 1)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    Max players
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={data.max || 3}
                    onChange={(e) =>
                      updateRole(role, "max", parseInt(e.target.value) || 3)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <input
                placeholder="Skill requirements, notes… (optional)"
                value={data.description || ""}
                onChange={(e) =>
                  updateRole(role, "description", e.target.value)
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Squad Builder ────────────────────────────────────────────────────────────

function SquadBuilder({ squad, setSquad, maxSize, requirements }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const token = localStorage.getItem("token");

  const searchPlayers = async (q) => {
    if (!q.trim()) return setSearchResults([]);
    setSearching(true);
    try {
      const res = await axios.get(`${API_URL}/players/search?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data.players || res.data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
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
        ...player,
        isSubstitute,
        jerseyNumber: isSubstitute
          ? null
          : prev.filter((p) => !p.isSubstitute).length + 1,
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removePlayer = (id) =>
    setSquad((prev) => prev.filter((p) => p._id !== id));

  const toggleSubstitute = (id) =>
    setSquad((prev) =>
      prev.map((p) =>
        p._id === id ? { ...p, isSubstitute: !p.isSubstitute } : p
      )
    );

  const mainSquad = squad.filter((p) => !p.isSubstitute);
  const substitutes = squad.filter((p) => p.isSubstitute);

  const roleCoverage = {};
  Object.entries(requirements).forEach(([role, data]) => {
    const count = squad.filter(
      (p) => p.role === role || p.playerRole === role
    ).length;
    roleCoverage[role] = {
      count,
      min: data.min,
      max: data.max,
      ok: count >= data.min,
    };
  });

  return (
    <div className="space-y-5">
      {/* Role coverage */}
      {Object.keys(requirements).length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-3">
            Role Coverage
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(roleCoverage).map(([role, info]) => (
              <div
                key={role}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
                  info.ok
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
                }`}
              >
                <span className={info.ok ? "text-emerald-400" : "text-amber-400"}>
                  {info.ok ? "✓" : "⚠"}
                </span>
                <span className={info.ok ? "text-emerald-300" : "text-amber-300"}>
                  {role}
                </span>
                <span className="ml-auto font-bold text-white">
                  {info.count}/{info.min}+
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search players by name or city…"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
        {(searching || searchResults.length > 0) && (
          <div className="absolute top-full mt-2 w-full bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-20 overflow-hidden max-h-60 overflow-y-auto">
            {searching && (
              <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                <span className="animate-spin">⏳</span> Searching…
              </div>
            )}
            {searchResults.map((p) => {
              const alreadyAdded = squad.some((s) => s._id === p._id);
              return (
                <div
                  key={p._id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0 ${
                    alreadyAdded ? "opacity-50" : "cursor-pointer"
                  }`}
                >
                  <Avatar photo={p.photo} name={p.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {p.name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {p.role || p.playerRole || "Player"}{" "}
                      {p.city ? `· ${p.city}` : ""}
                    </p>
                  </div>
                  {!alreadyAdded && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => addPlayer(p, false)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition"
                      >
                        + Main
                      </button>
                      <button
                        onClick={() => addPlayer(p, true)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition"
                      >
                        + Sub
                      </button>
                    </div>
                  )}
                  {alreadyAdded && (
                    <span className="text-xs text-slate-600">Added</span>
                  )}
                </div>
              );
            })}
            {!searching && searchResults.length === 0 && searchQuery && (
              <div className="px-4 py-3 text-sm text-slate-500">
                No players found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Squad counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {mainSquad.length} main · {substitutes.length} subs · {squad.length}/
          {maxSize} total
        </span>
        <div className="flex h-2 flex-1 mx-4 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
            style={{ width: `${Math.min((squad.length / maxSize) * 100, 100)}%` }}
          />
        </div>
        <span
          className={`text-xs font-bold ${
            squad.length >= maxSize ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {maxSize - squad.length} slots left
        </span>
      </div>

      {/* Main Squad */}
      {mainSquad.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">
            🏏 Main Squad ({mainSquad.length})
          </p>
          <div className="space-y-2">
            {mainSquad.map((p, i) => (
              <div
                key={p._id}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 group hover:border-emerald-500/20 transition"
              >
                <span className="text-xs text-slate-500 font-bold w-5 text-center">
                  {i + 1}
                </span>
                <Avatar photo={p.photo} name={p.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {p.name}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {p.role || p.playerRole || "Player"}
                  </p>
                </div>
                <button
                  onClick={() => toggleSubstitute(p._id)}
                  className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 transition"
                >
                  → Sub
                </button>
                <button
                  onClick={() => removePlayer(p._id)}
                  className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">
            🔄 Substitutes ({substitutes.length})
          </p>
          <div className="space-y-2">
            {substitutes.map((p) => (
              <div
                key={p._id}
                className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3 group hover:border-amber-500/30 transition"
              >
                <span className="text-xs text-amber-600">SUB</span>
                <Avatar photo={p.photo} name={p.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {p.name}
                  </p>
                  <p className="text-amber-600 text-xs">
                    {p.role || p.playerRole || "Player"}
                  </p>
                </div>
                <button
                  onClick={() => toggleSubstitute(p._id)}
                  className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 transition"
                >
                  → Main
                </button>
                <button
                  onClick={() => removePlayer(p._id)}
                  className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {squad.length === 0 && (
        <div className="text-center py-10 text-slate-600">
          <p className="text-4xl mb-2">🏏</p>
          <p className="text-sm">Search and add players to build your squad</p>
        </div>
      )}
    </div>
  );
}

// ─── Tournament Chat ──────────────────────────────────────────────────────────

function TournamentChat({ tournamentId, tournamentName, user, token }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef();

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/tournaments/${tournamentId}/chat`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [tournamentId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    const optimistic = {
      _id: Date.now(),
      sender: { _id: user._id, name: user.name },
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    try {
      await axios.post(
        `${API_URL}/tournaments/${tournamentId}/chat`,
        {
          senderId: user._id,
          senderName: user.name,
          content: optimistic.content,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMessages();
    } catch {
      // keep optimistic message
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-xl">
          💬
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{tournamentName}</p>
          <p className="text-slate-500 text-xs">
            Tournament Chat · All squad members
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            <span className="animate-spin mr-2">⏳</span> Loading chat…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe =
              msg.sender?._id === user?._id || msg.sender === user?._id;
            return (
              <div
                key={msg._id}
                className={`flex items-end gap-2 ${
                  isMe ? "flex-row-reverse" : ""
                }`}
              >
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f4b942] to-[#e09030] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {(
                      msg.sender?.name ||
                      msg.senderName ||
                      "?"
                    )[0].toUpperCase()}
                  </div>
                )}
                <div
                  className={`max-w-[75%] ${
                    isMe ? "items-end" : "items-start"
                  } flex flex-col gap-1`}
                >
                  {!isMe && (
                    <span className="text-[10px] text-slate-500 px-2">
                      {msg.sender?.name || msg.senderName}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm"
                        : "bg-white/8 border border-white/10 text-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-600 px-2">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message…"
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
        >
          {sending ? (
            <span className="animate-spin text-xs">⏳</span>
          ) : (
            "➤"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── View Tournament Modal ────────────────────────────────────────────────────

function TournamentViewModal({
  tournament: init,
  onClose,
  user,
  token,
  isOwner,
  onUpdate,
}) {
  const [tournament, setTournament] = useState(init);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/tournaments/${tournament._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setTournament(res.data.tournament);
        if (onUpdate) onUpdate(res.data.tournament);
      }
    } catch {}
  };

  const approveRequest = async (reqId) => {
    setLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/tournaments/${tournament._id}/requests/${reqId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMsg("✅ Player approved!");
        await refresh();
      }
    } catch (e) {
      setMsg("❌ " + (e.response?.data?.message || "Error"));
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const rejectRequest = async (reqId) => {
    setLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/tournaments/${tournament._id}/requests/${reqId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMsg("Request rejected");
        await refresh();
      }
    } catch (e) {
      setMsg("❌ " + (e.response?.data?.message || "Error"));
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const removeSquadPlayer = async (squadId) => {
    if (!window.confirm("Remove player from squad?")) return;
    setLoading(true);
    try {
      await axios.delete(
        `${API_URL}/tournaments/${tournament._id}/squad/${squadId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refresh();
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const pending =
    tournament.joinRequests?.filter((r) => r.status === "pending") || [];
  const bannerUrl = tournament.banner ? photoUrl(tournament.banner) : null;

  const tabs = [
    { id: "overview", label: "📋 Overview" },
    { id: "squad", label: `🏏 Squad (${tournament.squad?.length || 0})` },
    ...(isOwner
      ? [
          {
            id: "requests",
            label: `📩 Requests${
              pending.length > 0 ? ` (${pending.length})` : ""
            }`,
          },
        ]
      : []),
    { id: "requirements", label: "📌 Requirements" },
    { id: "chat", label: "💬 Chat" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div
        className="relative w-full sm:max-w-2xl bg-gradient-to-b from-[#0d1117] to-[#080b0f] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {bannerUrl && (
          <div className="relative h-36 rounded-t-3xl overflow-hidden flex-shrink-0">
            <img
              src={bannerUrl}
              alt="Tournament banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d1117]" />
          </div>
        )}

        <div
          className={`px-6 ${bannerUrl ? "pt-3" : "pt-6"} pb-4 border-b border-white/10 flex-shrink-0`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {tournament.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f4b942]/15 text-[#f4b942] border border-[#f4b942]/30">
                  {tournament.format}
                </span>
                {tournament.matchType && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0a1628]/30 text-white/70 border border-white/20">
                    {tournament.matchType}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white truncate">
                {tournament.name}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                📍 {tournament.location} · By {tournament.ownerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center flex-shrink-0 transition"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tournament.prizePool && (
              <span className="bg-yellow-500/15 border border-yellow-500/25 rounded-full px-3 py-1 text-xs text-yellow-300">
                🏆 {tournament.prizePool}
              </span>
            )}
            {tournament.momPrize && (
              <span className="bg-orange-500/15 border border-orange-500/25 rounded-full px-3 py-1 text-xs text-orange-300">
                ⭐ MOM: {tournament.momPrize}
              </span>
            )}
            {tournament.mosPrize && (
              <span className="bg-pink-500/15 border border-pink-500/25 rounded-full px-3 py-1 text-xs text-pink-300">
                🎖 MOS: {tournament.mosPrize}
              </span>
            )}
            {tournament.entryFee > 0 && (
              <span className="bg-[#d1fae5] border border-[#a7f3d0] rounded-full px-3 py-1 text-xs text-[#065f46]">
                💵 ₹{tournament.entryFee} entry
              </span>
            )}
            {tournament.entryFee == 0 && (
              <span className="bg-[#d1fae5] border border-[#a7f3d0] rounded-full px-3 py-1 text-xs text-[#065f46]">
                🆓 Free entry
              </span>
            )}
          </div>
        </div>

        <div className="px-4 pt-3 flex gap-1 overflow-x-auto flex-shrink-0 border-b border-white/5 pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition border-b-2 ${
                tab === t.id
                  ? "text-emerald-400 border-emerald-400 bg-emerald-500/5"
                  : "text-slate-500 border-transparent hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {msg && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm border ${
                msg.startsWith("✅")
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {msg}
            </div>
          )}

          {tab === "overview" && (
            <div className="space-y-4">
              {tournament.description && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">
                    About
                  </p>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {tournament.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Format", value: tournament.format, icon: "🏏" },
                  {
                    label: "Match Type",
                    value: tournament.matchType || "—",
                    icon: "⚔️",
                  },
                  { label: "City", value: tournament.city, icon: "📍" },
                  {
                    label: "Pitch Type",
                    value: tournament.pitchType || "—",
                    icon: "🟩",
                  },
                  {
                    label: "Start",
                    value: new Date(tournament.startDate).toDateString(),
                    icon: "📅",
                  },
                  tournament.endDate && {
                    label: "End",
                    value: new Date(tournament.endDate).toDateString(),
                    icon: "📅",
                  },
                  tournament.registrationDeadline && {
                    label: "Reg. Deadline",
                    value: new Date(
                      tournament.registrationDeadline
                    ).toDateString(),
                    icon: "⏰",
                  },
                  { label: "Max Teams", value: tournament.maxTeams, icon: "👥" },
                  {
                    label: "Squad Size",
                    value: `Up to ${tournament.maxSquadSize}`,
                    icon: "🧑‍🤝‍🧑",
                  },
                  {
                    label: "Organiser",
                    value: tournament.ownerName,
                    icon: "👤",
                  },
                  tournament.ageGroup && {
                    label: "Age Group",
                    value: tournament.ageGroup,
                    icon: "🎂",
                  },
                  tournament.gender && {
                    label: "Gender",
                    value: tournament.gender,
                    icon: "⚧",
                  },
                ]
                  .filter(Boolean)
                  .map(({ label, value, icon }) => (
                    <div
                      key={label}
                      className="bg-white/5 border border-white/10 rounded-xl p-3"
                    >
                      <p className="text-slate-500 text-xs mb-0.5">
                        {icon} {label}
                      </p>
                      <p className="text-white text-sm font-medium">{value}</p>
                    </div>
                  ))}
              </div>
              {tournament.rules && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">
                    📜 Rules
                  </p>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {tournament.rules}
                  </p>
                </div>
              )}
              {tournament.contactInfo && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">
                    📞 Contact
                  </p>
                  <p className="text-slate-300 text-sm">
                    {tournament.contactInfo}
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "squad" && (
            <div>
              {tournament.squad?.length === 0 ? (
                <div className="text-center py-10 text-slate-600">
                  <p className="text-4xl mb-2">🏏</p>
                  <p>No players in squad yet</p>
                </div>
              ) : (
                <>
                  {tournament.squad.filter((p) => !p.isSubstitute).length >
                    0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">
                        Main Squad
                      </p>
                      <div className="space-y-2">
                        {tournament.squad
                          .filter((p) => !p.isSubstitute)
                          .map((p, i) => (
                            <div
                              key={p._id}
                              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 group hover:border-emerald-500/20 transition"
                            >
                              <span className="text-xs text-slate-500 font-bold w-5 text-center">
                                {p.jerseyNumber || i + 1}
                              </span>
                              <Avatar
                                photo={p.playerPhoto}
                                name={p.playerName}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {p.playerName}
                                </p>
                                <p className="text-slate-500 text-xs">
                                  {p.playerRole || "Player"}
                                </p>
                              </div>
                              {p.playerStats && (
                                <div className="hidden sm:flex gap-2 text-xs text-slate-500">
                                  <span>{p.playerStats.runs || 0}R</span>
                                  <span>{p.playerStats.wickets || 0}W</span>
                                </div>
                              )}
                              {isOwner && (
                                <button
                                  onClick={() => removeSquadPlayer(p._id)}
                                  disabled={loading}
                                  className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 transition"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  {tournament.squad.filter((p) => p.isSubstitute).length >
                    0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">
                        Substitutes
                      </p>
                      <div className="space-y-2">
                        {tournament.squad
                          .filter((p) => p.isSubstitute)
                          .map((p) => (
                            <div
                              key={p._id}
                              className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3 group"
                            >
                              <span className="text-[10px] text-amber-600 font-bold w-5 text-center">
                                SUB
                              </span>
                              <Avatar
                                photo={p.playerPhoto}
                                name={p.playerName}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {p.playerName}
                                </p>
                                <p className="text-amber-600 text-xs">
                                  {p.playerRole || "Player"}
                                </p>
                              </div>
                              {isOwner && (
                                <button
                                  onClick={() => removeSquadPlayer(p._id)}
                                  disabled={loading}
                                  className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 transition"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "requests" && isOwner && (
            <div className="space-y-3">
              {(tournament.joinRequests || []).length === 0 ? (
                <div className="text-center py-10 text-slate-600">
                  <p className="text-4xl mb-2">📩</p>
                  <p>No requests yet</p>
                </div>
              ) : (
                (tournament.joinRequests || []).map((r) => (
                  <div
                    key={r._id}
                    className={`border rounded-2xl p-4 ${
                      r.status === "pending"
                        ? "bg-white/5 border-white/10"
                        : r.status === "approved"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-red-500/5 border-red-500/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar photo={r.playerPhoto} name={r.playerName} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">
                          {r.playerName}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {r.playerRole || "Player"}
                          {r.playerCity ? ` · ${r.playerCity}` : ""}
                        </p>
                        {r.playerStats && (
                          <p className="text-slate-500 text-xs mt-0.5">
                            {r.playerStats.matches || 0}M ·{" "}
                            {r.playerStats.runs || 0}R ·{" "}
                            {r.playerStats.wickets || 0}W
                          </p>
                        )}
                      </div>
                      {r.status === "pending" ? (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => approveRequest(r._id)}
                            disabled={loading}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition disabled:opacity-50"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => rejectRequest(r._id)}
                            disabled={loading}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                            r.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {r.status === "approved" ? "✓ Approved" : "✕ Rejected"}
                        </span>
                      )}
                    </div>
                    {r.message && (
                      <p className="mt-2 text-xs text-slate-400 bg-white/5 rounded-xl px-3 py-2 border border-white/5 italic">
                        "{r.message}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "requirements" && (
            <div>
              {!tournament.playerRequirements ||
              Object.keys(tournament.playerRequirements).length === 0 ? (
                <div className="text-center py-10 text-slate-600">
                  <p className="text-4xl mb-2">📋</p>
                  <p>No specific role requirements set</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-4">
                    Player requirements by role
                  </p>
                  {Object.entries(tournament.playerRequirements).map(
                    ([role, data]) => {
                      const current =
                        tournament.squad?.filter(
                          (p) => p.playerRole === role
                        ).length || 0;
                      const pct = data.max
                        ? Math.min((current / data.max) * 100, 100)
                        : current > 0
                        ? 100
                        : 0;
                      return (
                        <div
                          key={role}
                          className="bg-white/5 border border-white/10 rounded-2xl p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium text-sm">
                              🏏 {role}
                            </span>
                            <span className="text-xs text-slate-400">
                              {current} / {data.min}–{data.max} needed
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-2">
                            <div
                              className={`h-full rounded-full transition-all ${
                                current >= data.min
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {data.description && (
                            <p className="text-slate-500 text-xs">
                              {data.description}
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "chat" && user && (
            <TournamentChat
              tournamentId={tournament._id}
              tournamentName={tournament.name}
              user={user}
              token={token}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main CreateTournament Page ───────────────────────────────────────────────

export default function CreateTournament() {
  const STEPS = ["Basics", "Details", "Requirements", "Squad", "Review"];
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [viewCreated, setViewCreated] = useState(false);

const token = localStorage.getItem("token");
const userRaw = localStorage.getItem("user");
const userParsed = userRaw ? JSON.parse(userRaw) : null;
const user = userParsed ? {
  _id: userParsed._id,
  name: userParsed.Fullname || userParsed.name || "",
  city: userParsed.city || "",
} : null;

  // Banner
  const [banner, setBanner] = useState("");
  const [bannerFile, setBannerFile] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    format: "T20",
    matchType: "League + Knockout",
    location: "",
    city: user?.city || "",
    pitchType: "Turf",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    prizePool: "",
    runnerUpPrize: "",
    momPrize: "",
    mosPrize: "",
    entryFee: 0,
    maxTeams: 8,
    maxSquadSize: 15,
    ageGroup: "",
    gender: "Open",
    rules: "",
    contactInfo: "",
  });

  // Step 3: requirements
  const [requirements, setRequirements] = useState({});

  // Step 4: squad
  const [squad, setSquad] = useState([]);

  // Generic setter for most fields
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Date change handlers with cascade validation ──────────────────────────

  /**
   * When registration deadline changes:
   *   - If startDate is no longer valid (not > regDeadline), clear it (and endDate too).
   */
  const handleRegistrationDeadline = (value) => {
    setForm((f) => {
      const next = { ...f, registrationDeadline: value };
      // Start date must be strictly after registration deadline
      if (next.startDate && next.startDate <= value) {
        next.startDate = "";
        next.endDate = "";
      }
      // End date depends on startDate; if startDate cleared, endDate is invalid too
      if (!next.startDate) next.endDate = "";
      return next;
    });
    setError("");
  };

  /**
   * When start date changes:
   *   - Validate it is after registration deadline (if set).
   *   - If endDate is now < startDate + 3 days, clear endDate.
   */
  const handleStartDate = (value) => {
    setForm((f) => {
      const next = { ...f, startDate: value };
      // End date must be at least 3 days after start
      if (next.endDate && next.endDate < addDays(value, 3)) {
        next.endDate = "";
      }
      return next;
    });

    // Show inline validation error (non-blocking — user can still proceed after fixing)
    if (form.registrationDeadline && value && value <= form.registrationDeadline) {
      setError(
        `Start date must be after the registration deadline (${fmtDate(form.registrationDeadline)}).`
      );
    } else {
      setError("");
    }
  };

  /**
   * When end date changes:
   *   - Validate it is at least 3 days after start date.
   */
  const handleEndDate = (value) => {
    if (form.startDate && value && value < addDays(form.startDate, 3)) {
      setError(
        `End date must be at least 3 days after start date (${fmtDate(form.startDate)}).`
      );
    } else {
      setError("");
    }
    setForm((f) => ({ ...f, endDate: value }));
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition";
  const labelCls = "text-xs text-slate-400 font-medium mb-1.5 block";
  const selectCls = `${inputCls} cursor-pointer`;
  const hintCls = "text-[11px] text-slate-500 mt-1";

  // ── Step validation ───────────────────────────────────────────────────────

  const validate = () => {
    if (step === 0) {
      if (!form.name.trim()) return "Tournament name is required";
      if (!form.location.trim()) return "Venue / Location is required";
      if (!form.city.trim()) return "City is required";
      if (!form.startDate) return "Start date is required";
    }
    if (step === 1) {
      if (
        form.registrationDeadline &&
        form.startDate &&
        form.startDate <= form.registrationDeadline
      ) {
        return `Start date must be after the registration deadline (${fmtDate(
          form.registrationDeadline
        )}).`;
      }
      if (
        form.endDate &&
        form.startDate &&
        form.endDate < addDays(form.startDate, 3)
      ) {
        return `End date must be at least 3 days after start date (${fmtDate(
          form.startDate
        )}).`;
      }
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user?._id || !user?.name) {
      setError("You must be logged in to create a tournament.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Build a flat payload with all required + optional fields explicitly listed.
      // Never rely on spread alone — make sure ownerId/ownerName are always present.
      const payload = {
        name:                 form.name,
        description:          form.description,
        format:               form.format,
        matchType:            form.matchType,
        location:             form.location,
        city:                 form.city,
        pitchType:            form.pitchType,
        startDate:            form.startDate,
        endDate:              form.endDate,
        registrationDeadline: form.registrationDeadline,
        prizePool:            form.prizePool,
        runnerUpPrize:        form.runnerUpPrize,
        momPrize:             form.momPrize,
        mosPrize:             form.mosPrize,
        entryFee:             form.entryFee,
        maxTeams:             form.maxTeams,
        maxSquadSize:         form.maxSquadSize,
        ageGroup:             form.ageGroup,
        gender:               form.gender,
        rules:                form.rules,
        contactInfo:          form.contactInfo,
        ownerId:              user._id,
        ownerName:            user.name,
        playerRequirements:   requirements,
      };

      let res;
      if (bannerFile) {
        const fd = new FormData();
        // Append every field explicitly — objects as JSON strings, primitives as-is.
        // Skip null/undefined so the server doesn't receive the string "undefined".
        Object.entries(payload).forEach(([k, v]) => {
          if (v === null || v === undefined) return;
          if (typeof v === "object") {
            fd.append(k, JSON.stringify(v));
          } else {
            fd.append(k, String(v));
          }
        });
        fd.append("banner", bannerFile);
        res = await axios.post(`${API_URL}/tournaments`, fd, {
          headers: {
            Authorization: `Bearer ${token}`,
            // Do NOT manually set Content-Type for multipart — let the browser set
            // the boundary automatically.
          },
        });
      } else {
        res = await axios.post(`${API_URL}/tournaments`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (res.data.success) {
        const newTournament = res.data.tournament;
        if (squad.length > 0) {
          try {
            await axios.post(
              `${API_URL}/tournaments/${newTournament._id}/squad/bulk`,
              {
                players: squad.map((p) => ({
                  playerId: p._id,
                  playerName: p.name,
                  playerRole: p.role || p.playerRole,
                  playerPhoto: p.photo,
                  isSubstitute: p.isSubstitute || false,
                })),
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch {
            // squad bulk add may not be available
          }
        }
        setCreated(newTournament);
        setStep(STEPS.length);
      } else {
        setError(res.data.message || "Failed to create tournament");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset helper ──────────────────────────────────────────────────────────

  const resetAll = () => {
    setStep(0);
    setCreated(null);
    setForm({
      name: "",
      description: "",
      format: "T20",
      matchType: "League + Knockout",
      location: "",
      city: user?.city || "",
      pitchType: "Turf",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      prizePool: "",
      runnerUpPrize: "",
      momPrize: "",
      mosPrize: "",
      entryFee: 0,
      maxTeams: 8,
      maxSquadSize: 15,
      ageGroup: "",
      gender: "Open",
      rules: "",
      contactInfo: "",
    });
    setBanner("");
    setBannerFile(null);
    setRequirements({});
    setSquad([]);
  };

  // ── Success Screen ────────────────────────────────────────────────────────

  if (step === STEPS.length && created) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 text-white flex items-center justify-center">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl shadow-emerald-500/30 animate-bounce">
            🏆
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Tournament Created!
          </h1>
          <p className="text-slate-400 mb-2">{created.name}</p>
          <div className="flex justify-center gap-3 flex-wrap mb-8">
            <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-3 py-1 rounded-full text-xs">
              {created.format}
            </span>
            <span className="bg-[#f4b942]/15 text-[#f4b942] border border-[#f4b942]/25 px-3 py-1 rounded-full text-xs">
              📍 {created.city}
            </span>
            {created.prizePool && (
              <span className="bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 px-3 py-1 rounded-full text-xs">
                🏅 {created.prizePool}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setViewCreated(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
            >
              👁 View Tournament
            </button>
            <button
              onClick={resetAll}
              className="px-6 py-3 rounded-2xl bg-white/5 border border-white/15 text-white font-semibold text-sm hover:bg-white/10 transition"
            >
              + Create Another
            </button>
          </div>
        </div>

        {viewCreated && (
          <TournamentViewModal
            tournament={created}
            onClose={() => setViewCreated(false)}
            user={user}
            token={token}
            isOwner={true}
            onUpdate={(t) => setCreated(t)}
          />
        )}
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 text-white">
      <div className="max-w-2xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
              🏆
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Create Tournament
              </h1>
              <p className="text-slate-500 text-sm">
                Set up your cricket tournament in minutes
              </p>
            </div>
          </div>
        </div>

        <StepBar current={step} steps={STEPS} />

        {/* Step card */}
        <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-6 shadow-xl">

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          {/* ── STEP 0: Basics ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <p className="text-lg font-bold text-white mb-1">
                  Tournament Basics
                </p>
                <p className="text-slate-500 text-sm">
                  Start with a banner and the key details
                </p>
              </div>

              <BannerUpload
                banner={banner}
                setBanner={setBanner}
                setBannerFile={setBannerFile}
              />

              {/* Start date on step 0 so it's required before proceeding */}
              <div>
                <label className={labelCls}>Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  min={
                    form.registrationDeadline
                      ? addDays(form.registrationDeadline, 1)
                      : ""
                  }
                  onChange={(e) => handleStartDate(e.target.value)}
                  className={inputCls}
                />
                {form.registrationDeadline && (
                  <p className={hintCls}>
                    Must be after registration deadline (
                    {fmtDate(form.registrationDeadline)})
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Tournament Name *</label>
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Inter-City T20 Championship 2025"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Tell players what makes your tournament special…"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Format *</label>
                  <select
                    value={form.format}
                    onChange={set("format")}
                    className={selectCls}
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f} className="bg-slate-900">
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Match Type</label>
                  <select
                    value={form.matchType}
                    onChange={set("matchType")}
                    className={selectCls}
                  >
                    {MATCH_TYPES.map((f) => (
                      <option key={f} value={f} className="bg-slate-900">
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>City *</label>
                  <input
                    value={form.city}
                    onChange={set("city")}
                    placeholder="Bhopal"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Pitch Type</label>
                  <select
                    value={form.pitchType}
                    onChange={set("pitchType")}
                    className={selectCls}
                  >
                    {PITCH_TYPES.map((f) => (
                      <option key={f} value={f} className="bg-slate-900">
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Venue / Ground *</label>
                <input
                  value={form.location}
                  onChange={set("location")}
                  placeholder="BSCA Cricket Ground, Kolar Road"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* ── STEP 1: Details ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-lg font-bold text-white mb-1">
                  Schedule & Prizes
                </p>
                <p className="text-slate-500 text-sm">
                  Dates, entry fees, and prize details
                </p>
              </div>

              {/* Date row — all three together with cascade validation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Registration Deadline</label>
                  <input
                    type="date"
                    value={form.registrationDeadline}
                    onChange={(e) =>
                      handleRegistrationDeadline(e.target.value)
                    }
                    className={inputCls}
                  />
                  <p className={hintCls}>Teams must register by this date</p>
                </div>
                <div>
                  <label className={labelCls}>Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    min={
                      form.registrationDeadline
                        ? addDays(form.registrationDeadline, 1)
                        : ""
                    }
                    onChange={(e) => handleStartDate(e.target.value)}
                    className={inputCls}
                  />
                  {form.registrationDeadline && (
                    <p className={hintCls}>
                      After {fmtDate(form.registrationDeadline)}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={
                      form.startDate ? addDays(form.startDate, 3) : ""
                    }
                    onChange={(e) => handleEndDate(e.target.value)}
                    className={inputCls}
                  />
                  {form.startDate && (
                    <p className={hintCls}>
                      Min 3 days after {fmtDate(form.startDate)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Entry Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.entryFee}
                    onChange={set("entryFee")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max Teams</label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={form.maxTeams}
                    onChange={set("maxTeams")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Squad Size per Team</label>
                  <input
                    type="number"
                    min={5}
                    max={25}
                    value={form.maxSquadSize}
                    onChange={set("maxSquadSize")}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Prizes */}
              <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4">
                <p className="text-xs text-yellow-400 font-semibold uppercase tracking-widest mb-4">
                  🏅 Prize Details
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>🥇 Winner Prize Pool</label>
                    <input
                      value={form.prizePool}
                      onChange={set("prizePool")}
                      placeholder="e.g. ₹50,000 + Trophy"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>🥈 Runner-Up Prize</label>
                    <input
                      value={form.runnerUpPrize}
                      onChange={set("runnerUpPrize")}
                      placeholder="₹25,000"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>⭐ Man of the Match</label>
                    <input
                      value={form.momPrize}
                      onChange={set("momPrize")}
                      placeholder="₹2,000 per game"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>🎖 Man of the Series</label>
                    <input
                      value={form.mosPrize}
                      onChange={set("mosPrize")}
                      placeholder="₹10,000 + Medal"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Extra */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Age Group</label>
                  <input
                    value={form.ageGroup}
                    onChange={set("ageGroup")}
                    placeholder="e.g. U-19, Open, 35+"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select
                    value={form.gender}
                    onChange={set("gender")}
                    className={selectCls}
                  >
                    {["Open", "Men", "Women", "Mixed"].map((g) => (
                      <option key={g} value={g} className="bg-slate-900">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>📜 Tournament Rules</label>
                <textarea
                  value={form.rules}
                  onChange={set("rules")}
                  placeholder="e.g. DRS rules, powerplay rules, dress code, fair play policy…"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label className={labelCls}>📞 Contact Info</label>
                <input
                  value={form.contactInfo}
                  onChange={set("contactInfo")}
                  placeholder="Phone number, WhatsApp, Instagram handle…"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Player Requirements ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-lg font-bold text-white mb-1">
                  Player Requirements
                </p>
                <p className="text-slate-500 text-sm">
                  Define role slots so players know exactly what you need
                </p>
              </div>
              <RoleRequirements
                requirements={requirements}
                setRequirements={setRequirements}
              />
              {Object.keys(requirements).length === 0 && (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
                  <p className="text-slate-500 text-sm">
                    💡 No requirements set — all roles can join freely
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Squad Builder ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-lg font-bold text-white mb-1">
                  Build Your Squad
                </p>
                <p className="text-slate-500 text-sm">
                  Add up to {form.maxSquadSize} players (including substitutes)
                </p>
              </div>
              <SquadBuilder
                squad={squad}
                setSquad={setSquad}
                maxSize={form.maxSquadSize}
                requirements={requirements}
              />
            </div>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <p className="text-lg font-bold text-white mb-1">
                  Review & Publish
                </p>
                <p className="text-slate-500 text-sm">
                  Everything look good? Let's go live! 🚀
                </p>
              </div>

              {banner && (
                <div className="h-32 rounded-2xl overflow-hidden border border-white/10">
                  <img
                    src={banner}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center text-xl">
                    🏆
                  </div>
                  <div>
                    <p className="text-white font-bold">
                      {form.name || "Unnamed Tournament"}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {form.format} · {form.matchType} · {form.city}
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Venue: </span>
                    <span className="text-slate-200">{form.location}</span>
                  </div>
                  {form.registrationDeadline && (
                    <div>
                      <span className="text-slate-500">Reg. Deadline: </span>
                      <span className="text-slate-200">
                        {fmtDate(form.registrationDeadline)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Start: </span>
                    <span className="text-slate-200">
                      {fmtDate(form.startDate)}
                    </span>
                  </div>
                  {form.endDate && (
                    <div>
                      <span className="text-slate-500">End: </span>
                      <span className="text-slate-200">
                        {fmtDate(form.endDate)}
                      </span>
                    </div>
                  )}
                  {form.prizePool && (
                    <div>
                      <span className="text-slate-500">🥇 Winner: </span>
                      <span className="text-yellow-300">{form.prizePool}</span>
                    </div>
                  )}
                  {form.runnerUpPrize && (
                    <div>
                      <span className="text-slate-500">🥈 Runner: </span>
                      <span className="text-slate-200">{form.runnerUpPrize}</span>
                    </div>
                  )}
                  {form.momPrize && (
                    <div>
                      <span className="text-slate-500">⭐ MOM: </span>
                      <span className="text-slate-200">{form.momPrize}</span>
                    </div>
                  )}
                  {form.mosPrize && (
                    <div>
                      <span className="text-slate-500">🎖 MOS: </span>
                      <span className="text-slate-200">{form.mosPrize}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Entry: </span>
                    <span className="text-slate-200">
                      {form.entryFee > 0 ? `₹${form.entryFee}` : "Free"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Max Teams: </span>
                    <span className="text-slate-200">{form.maxTeams}</span>
                  </div>
                </div>
              </div>

              {Object.keys(requirements).length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">
                    📌 Role Requirements
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(requirements).map(([role, data]) => (
                      <span
                        key={role}
                        className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 rounded-xl px-3 py-1.5 text-xs font-medium"
                      >
                        {role}: {data.min}–{data.max}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">
                  🏏 Initial Squad
                </p>
                <p className="text-slate-300 text-sm">
                  {squad.filter((p) => !p.isSubstitute).length} main players ·{" "}
                  {squad.filter((p) => p.isSubstitute).length} substitutes
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/10">
            <button
              onClick={prev}
              disabled={step === 0}
              className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Back
            </button>

            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-8 bg-emerald-400"
                      : i < step
                      ? "w-3 bg-emerald-700"
                      : "w-3 bg-white/15"
                  }`}
                />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> Publishing…
                  </>
                ) : (
                  <>🚀 Publish Tournament</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}