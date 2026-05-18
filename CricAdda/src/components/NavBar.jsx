import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, MessageCircle } from 'lucide-react'
import UniversalContext from '../context/UniversalContext'
import Image from '../assets/virat_kohli.jpg'
import axios from 'axios'
import { API_URL, UPLOADS_URL } from '../api'

const NavBar = () => {
  const [open, setOpen] = useState(false)
  const { token, setToken } = useContext(UniversalContext)
  const [photo, setPhoto] = useState("")
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem("token")
    const userString = localStorage.getItem("user")
    const user = userString ? JSON.parse(userString) : null

    const loadProfilePhoto = async () => {
      if (!user?._id) return
      try {
        const res = await axios.get(`${API_URL}/players/profile/${user._id}`)
        const data = res.data.data

        if (data) {
          const photoUrl = data.photo
            ? data.photo.startsWith("http")
              ? data.photo
              : `${UPLOADS_URL}/${data.photo}`
            : ""
          setPhoto(photoUrl)
        }
      } catch (error) {
        console.log(error)
      }
    }

    const loadUnreadMessages = async () => {
      if (!user?._id) return
      try {
        const res = await axios.get(`${API_URL}/messages/conversations/${user._id}`)
        const conversations = res.data.data || []
        const storedSeen = localStorage.getItem("conversationSeenTimes")
        const seenTimes = storedSeen ? JSON.parse(storedSeen) : {}

        const unread = conversations.some((conv) => {
          if (!conv.lastMessageTime) return false
          const lastTime = new Date(conv.lastMessageTime).getTime()
          const seenTime = seenTimes[conv.bookingId] || 0
          return lastTime > seenTime
        })

        setHasUnreadMessages(unread)
      } catch (error) {
        console.log(error)
      }
    }

    const loadPendingRequests = async () => {
      if (!user?._id) return
      try {
        const userType = user.userType || localStorage.getItem("userType") || "Player"
        const bookingEndpoint =
          userType === "Owner"
            ? `${API_URL}/bookings/owner/${user._id}`
            : `${API_URL}/bookings/player/${user._id}/all`
        const headers = t ? { Authorization: `Bearer ${t}` } : {}
        const res = await axios.get(bookingEndpoint, { headers })
        const bookingItems = res.data.requests || res.data.bookings || []
        const pendingCount = bookingItems.filter((item) => item.status === "pending").length
        setHasPendingRequest(pendingCount > 0)
      } catch (error) {
        console.log(error)
      }
    }

    if (t) {
      setToken(t)
      loadProfilePhoto()
      loadUnreadMessages()
      loadPendingRequests()
    }
  }, [setToken])

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/80 border-b border-white/10 shadow-xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white">

        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-3xl bg-linear-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 text-xl">
            🏏
          </span>
          <div>
            <div className="text-2xl font-bold tracking-wide">CricAdda</div>
            <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">Hire local players</p>
          </div>
        </Link>

        <ul className="hidden md:flex gap-8 text-sm font-medium">
          <li>
            <Link to="/" className="hover:text-yellow-400 transition">
              Home
            </Link>
          </li>
          <li>
            <Link to="/FindPlayers" className="hover:text-yellow-400 transition">
              Find Players
            </Link>
          </li>
          <li>
            <Link to="/tournaments" className="hover:text-yellow-400 transition">
              Tournaments
            </Link>
          </li>
          <li>
            <Link to="/how-it-works" className="hover:text-yellow-400 transition">
              How It Works
            </Link>
          </li>
        </ul>

        <div className="hidden md:flex items-center gap-3">
          {token && (
            <Link
              to="/messages"
              className="relative inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-white/20 bg-white/5 text-white hover:bg-white/10 transition"
              title="Messages"
            >
              <MessageCircle size={20} />
              {hasUnreadMessages && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
              )}
            </Link>
          )}

          {token && (
            <Link
              to="/BookingRequests"
              className="relative inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-[1.02]"
            >
              <span>📩</span>
              Requests
              {hasPendingRequest && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/40" />
              )}
            </Link>
          )}

          {token ? (
            <Link
              to="/Profile"
              className="w-12 h-12 rounded-full overflow-hidden border border-white/20 hover:bg-white hover:text-black transition"
            >
              <img src={photo || Image} className="w-full h-full object-cover" alt="Profile" />
            </Link>
          ) : (
            <Link
              to="/Log_SignUp"
              className="border border-white/20 bg-white/5 px-5 py-2 rounded-2xl text-sm font-medium hover:bg-white hover:text-black transition"
            >
              Join as Player
            </Link>
          )}
        </div>

        <div className="md:hidden">
          <button onClick={() => setOpen(!open)} className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 p-2 hover:bg-white/10 transition">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden ml-3 mt-2 rounded-3xl border border-white/10 bg-black/95 backdrop-blur-xl text-white px-6 py-6 shadow-xl shadow-black/30">
          <div className="flex flex-col gap-4">
            <Link to="/" onClick={() => setOpen(false)} className="block text-base font-medium hover:text-yellow-400 transition">Home</Link>
            <Link to="/FindPlayers" onClick={() => setOpen(false)} className="block text-base font-medium hover:text-yellow-400 transition">Find Players</Link>
            <Link to="/tournaments" onClick={() => setOpen(false)} className="block text-base font-medium hover:text-yellow-400 transition">Tournaments</Link>
            <Link to="/how-it-works" onClick={() => setOpen(false)} className="block text-base font-medium hover:text-yellow-400 transition">How It Works</Link>
            {token && (
              <Link to="/messages" onClick={() => setOpen(false)} className="flex items-center gap-2 text-base font-medium hover:text-yellow-400 transition">
                <MessageCircle size={18} />
                Messages
                {hasUnreadMessages && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
              </Link>
            )}
            {token && (
              <Link to="/BookingRequests" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-base font-medium hover:border-slate-500 hover:text-white transition">
                <span>📩</span>
                Requests
                {hasPendingRequest && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
              </Link>
            )}
            {token ? (
              <Link to="/Profile" onClick={() => setOpen(false)} className="block border border-white/20 px-5 py-3 rounded-2xl text-center hover:bg-white/10 transition">
                Profile
              </Link>
            ) : (
              <Link to="/Log_SignUp" onClick={() => setOpen(false)} className="block border border-white/20 px-5 py-3 rounded-2xl text-center hover:bg-white/10 transition">
                Join as Player
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar
