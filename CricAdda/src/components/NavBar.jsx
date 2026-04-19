import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppRoutes from "../routes/AppRoutes";
import { useState } from 'react';
// import { Menu, X } from "lucide-react";
import {Menu,X} from "lucide-react"
import FindPlayers from '../pages/FindPlayers';
import { useContext } from 'react';
import UniversalContext from '../context/UniversalContext';

const NavBar = () => {
  const [open, setOpen] = useState(false);
  const {token, setToken} = useContext(UniversalContext)

  useEffect(()=>{
    const t = localStorage.getItem("token")
    const u = localStorage.getItem("user")

    if(t){
      setToken(t)
    }
  },[])

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="max-w-7x mx-auto px-6 py-4 flex items-center justify-between text-white">

        {/* Logo */}
        <Link to="/" className="text-2xl font-bold tracking-wide">
          🏏 CricAdda
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-10 text-sm font-medium">
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

        <div className="hidden md:flex gap-4">
          {token ?  <Link
            to="/Profile"
            className="border border-white/40 px-5 py-2 rounded-lg hover:bg-white hover:text-white transition"
          >
            profile
          </Link> :
           <Link
            to="/Log_SignUp"
            className="border border-white/40 px-5 py-2 rounded-lg hover:bg-white hover:text-white transition"
          >
            Join as Player
          </Link> }

          <Link
            to="/hire"
            className="bg-yellow-400  px-5 py-2 rounded-lg font-semibold text-white hover:bg-yellow-300 transition"
          >
            Hire Now
          </Link>
        </div>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button onClick={() => setOpen(!open)}>
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden flex flex-col ml-3 pt-1 bg-black/90 backdrop-blur-lg text-white px-6 pb-6 space-y-4">
          <Link to="/" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/players" onClick={() => setOpen(false)}>Find Players</Link>
          <Link to="/tournaments" onClick={() => setOpen(false)}>Tournaments</Link>
          <Link to="/how-it-works" onClick={() => setOpen(false)}>How It Works</Link>

         {token ?  <Link
            to="/Profile"
            className="border border-white/40 px-5 py-2 rounded-lg hover:bg-white hover:text-white transition"
          >
            profile
          </Link> :
           <Link
            to="/Log_SignUp"
            className="border border-white/40 px-5 py-2 rounded-lg hover:bg-white hover:text-white transition"
          >
            Join as Player
          </Link> }

          <Link
            to="/hire"
            onClick={() => setOpen(false)}
            className="block bg-yellow-400 text-black py-2 rounded text-center"
          >
            Hire Now
          </Link>
        </div>
      )}
    </nav>
  );
};

export default NavBar
