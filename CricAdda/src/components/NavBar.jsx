import React, { useEffect, useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, MessageCircle, Send, Bell } from "lucide-react";
import UniversalContext from "../context/UniversalContext";
import Image from "../assets/virat_kohli.jpg";
import axios from "axios";
import { API_URL, UPLOADS_URL } from "../api";

// ── Google Fonts injected once ────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector(`link[href="${fontLink.href}"]`))
  document.head.appendChild(fontLink);

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/FindPlayers", label: "Find Players" },
  { to: "/Tournaments", label: "Tournaments Squad" },
  { to: "/how-it-works", label: "How It Works" },
];

const NavBar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { token, setToken } = useContext(UniversalContext);
  const [photo, setPhoto] = useState("");
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const location = useLocation();


  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
  const t = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  const loadProfilePhoto = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(`${API_URL}/players/profile/${user._id}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = res.data.data;
      if (data?.photo)
        setPhoto(
          data.photo.startsWith("http")
            ? data.photo
            : `${UPLOADS_URL}/${data.photo}`,
        );
    } catch (_) {}
  };

  const loadUnreadMessages = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(
        `${API_URL}/messages/conversations/${user._id}`,
        { headers: { Authorization: `Bearer ${t}` } },
      );
      const seenTimes = JSON.parse(
        localStorage.getItem("conversationSeenTimes") || "{}",
      );
      const unread = (res.data.data || []).some((conv) => {
        if (!conv.lastMessageTime) return false;
        return (
          new Date(conv.lastMessageTime).getTime() >
          (seenTimes[conv.bookingId] || 0)
        );
      });
      setHasUnreadMessages(unread);
    } catch (_) {}
  };

  const loadPendingRequests = async () => {
    if (!user?._id) return;
    try {
      const userType =
        user.userType || localStorage.getItem("userType") || "Player";
      const endpoint =
        userType === "Owner"
          ? `${API_URL}/bookings/owner/${user._id}`
          : `${API_URL}/bookings/player/${user._id}/all`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const items = res.data.requests || res.data.bookings || [];
      setHasPendingRequest(items.some((i) => i.status === "pending"));
    } catch (_) {}
  };

  if (t) {
    setToken(t);
    loadProfilePhoto();
    loadUnreadMessages();
    loadPendingRequests();

    // ── Poll every 10 seconds so dots appear without reload ──
    const interval = setInterval(() => {
      loadUnreadMessages();
      loadPendingRequests();
    }, 10000);

    return () => clearInterval(interval);
  }
}, [setToken]);

useEffect(() => {
  const t = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  if (!t || !user?._id) return;

  // Re-check dots on every route change
  axios
    .get(`${API_URL}/messages/conversations/${user._id}`, {
      headers: { Authorization: `Bearer ${t}` },
    })
    .then((res) => {
      const seenTimes = JSON.parse(
        localStorage.getItem("conversationSeenTimes") || "{}",
      );
      const unread = (res.data.data || []).some((conv) => {
        if (!conv.lastMessageTime) return false;
        return (
          new Date(conv.lastMessageTime).getTime() >
          (seenTimes[conv.bookingId] || 0)
        );
      });
      setHasUnreadMessages(unread);
    })
    .catch(() => {});
}, [location.pathname]);
  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const { modalOpen } = useContext(UniversalContext);
  const userStoredString = localStorage.getItem("user");
  let name = localStorage.getItem("userName") || "";
  let userType = localStorage.getItem("userType") || "Player";
  let userId = localStorage.getItem("userId") || "";

  try {
    const parsedUser = userStoredString ? JSON.parse(userStoredString) : null;
    name = parsedUser?.name || name;
    userType = parsedUser?.userType || userType;
    userId = parsedUser?._id || userId;
  } catch (_e) {
    // ignore invalid stored user data
  }

  if (modalOpen) return null; 

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-100 bg-[#0a1628] transition-shadow duration-300 ${scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.35)]" : ""}`}
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Main bar ── */}
      <div className="max-w-325 mx-auto px-4 sm:px-10 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#f4b942] flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0a1628"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width={20}
              height={20}
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3c0 0 4 5 4 9s-4 9-4 9" />
              <path d="M3 12h18" />
            </svg>
          </div>
          <span
            className="text-white text-[22px] tracking-wide leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            CRIC<span className="text-[#f4b942] tracking-wide">ADDA</span>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <ul className="hidden md:flex items-center gap-3 list-none m-0 p-0">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`
                  text-sm font-medium px-4 py-2 rounded-lg no-underline transition-all duration-200 whitespace-nowrap
                  ${isActive(to)
                    ? "text-[#f4b942] bg-[rgba(244,185,66,0.08)] border border-[#f4b942]"
                    : "text-white/80 border border-transparent hover:text-white hover:bg-white/8"
                  }
                `}
              >
                {label}
              </Link>
            </li>
          ))}
          {token && userId && (
            <li>
              <Link
                to={`/OwnerDashboard/${userId}`}
                className={`
                  text-sm font-medium px-4 py-2 rounded-lg no-underline transition-all duration-200 whitespace-nowrap
                  ${isActive("/OwnerDashboard") || isActive(`/OwnerDashboard/${userId}`)
                    ? "text-[#f4b942] bg-[rgba(244,185,66,0.08)] border border-[#f4b942]"
                    : "text-white/80 border border-transparent hover:text-white hover:bg-white/8"
                  }
                `}
              >
                Dashboard
              </Link>
            </li>
          )}
        </ul>

        {/* ── Desktop right actions ── */}
        <div className="hidden md:flex items-center gap-2.5">
          {token && (
            <Link
              to="/messages"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white no-underline transition-colors duration-200"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.2)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
            >
              <MessageCircle size={16} />
              Messages
              {hasUnreadMessages && (
                <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-[#f4b942]" />
              )}
            </Link>
          )}

          {token && (
            <Link
              to="/BookingRequests"
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#f4b942] text-[#0a1628] no-underline hover:opacity-90 transition-opacity"
              style={{ border: "1.5px solid rgba(244,185,66,0.5)" ,background: "#f4b942" }}
            >
              <Send size={14} style={{ background: "#f4b942" }} />
              Requests
              {hasPendingRequest && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ef4444]" />
              )}
            </Link>
          )}

          {token && (
            <Link
              to="/invites"
              className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Bell size={20} />
            </Link>
          )}

          {token ? (
            <Link
              to="/Profile"
              className="block w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden no-underline"
              style={{ border: "2px solid rgba(244,185,66,0.5)" }}
            >
              {photo ? (
                  <img
                    src={photo}
                    alt={name}
                    className="w-full h-full rounded-full object-cover"
                    style={{ border: "4px solid #f4b942", boxShadow: "0 0 28px rgba(244,185,66,0.35)" }}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-2xl sm:text-xl text-[#0a1628]"
                    style={{ background: "linear-gradient(135deg,#f0f4ff,#e0e7ff)", border: "4px solid #f4b942", boxShadow: "0 0 28px rgba(244,185,66,0.35)" }}
                  >
                    {name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
            </Link>
          ) : (
            <Link
              to="/Log_SignUp"
              className="px-5 py-2 rounded-lg text-sm font-medium text-white no-underline transition-colors duration-200 hover:bg-white/10"
              style={{ border: "1.5px solid rgba(255,255,255,0.4)" }}
            >
              Log In
            </Link>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white cursor-pointer transition-colors"
          style={{
            border: "1.5px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {open && (
        <div
          className="md:hidden flex flex-col gap-1 px-4 pt-4 pb-6"
          style={{
            background: "#0d1e38",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`text-[15px] font-medium px-3 py-2.5 rounded-lg no-underline transition-colors ${isActive(to)
                ? "text-[#f4b942] bg-[rgba(244,185,66,0.08)]"
                : "text-white/85 hover:bg-white/6"
                }`}
            >
              {label}
            </Link>
          ))}

          <div
            className="h-px my-2"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />

          {token && (
            <Link
              to="/messages"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-white/85 no-underline text-[15px] font-medium px-3 py-2.5 rounded-lg hover:bg-white/6 transition-colors"
            >
              <MessageCircle size={18} />
              Messages
              {hasUnreadMessages && (
                <span className="w-2 h-2 rounded-full bg-[#f4b942] ml-0.5" />
              )}
            </Link>
          )}

          {token && (
            <Link
              to="/BookingRequests"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-white/85 no-underline text-[15px] font-medium px-3 py-2.5 rounded-lg hover:bg-white/6 transition-colors"
            >
              <Send size={18} />
              Requests
              {hasPendingRequest && (
                <span className="w-2 h-2 rounded-full bg-[#ef4444] ml-0.5" />
              )}
            </Link>
          )}

          {token && userId && (
            <Link
              to={`/OwnerDashboard/${userId}`}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 text-[15px] font-medium px-3 py-2.5 rounded-lg no-underline transition-colors ${isActive("/OwnerDashboard") || isActive(`/OwnerDashboard/${userId}`)
                ? "text-[#f4b942] bg-[rgba(244,185,66,0.08)]"
                : "text-white/85 hover:bg-white/6"
              }`}
            >
              🧑‍💼 Dashboard
            </Link>
          )}

          {token && (
            <Link
              to="/invites"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-white/85 no-underline text-[15px] font-medium px-3 py-2.5 rounded-lg hover:bg-white/6 transition-colors"
            >
              <Bell size={18} />
              Invites
            </Link>
          )}

          <div className="mt-2">
            {token ? (
              <Link
                to="/Profile"
                onClick={() => setOpen(false)}
                className="block text-center bg-[#f4b942] text-[#0a1628] px-5 py-2.5 rounded-lg font-semibold text-sm no-underline hover:opacity-90 transition-opacity"
              >
                My Profile
              </Link>
            ) : (
              <Link
                to="/Log_SignUp"
                onClick={() => setOpen(false)}
                className="block text-center bg-[#f4b942] text-[#0a1628] px-5 py-2.5 rounded-lg font-semibold text-sm no-underline hover:opacity-90 transition-opacity"
              >
                Log In / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
