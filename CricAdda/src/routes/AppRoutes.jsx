import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import FindPlayers from '../pages/FindPlayers'
import Tournaments from '../pages/TournamentsSquad'
import CreateTournament from '../pages/CreateTournament'   // ← NEW
import Log_SignUp from '../pages/Log_SignUp'
import Profile from '../pages/Profile'
import PlayerProfile from '../pages/PlayerProfile'
import BookingRequests from '../pages/BookingRequests'
import Messages from '../pages/Messages'
import OwnerDashboard from '../pages/OwnerDashboard'
import AdminPage from '../components/AdminPage'
import HowItWorks from '../pages/How_It_Works'
import PlayerInvites from "../pages/PlayerInvites";

const AppRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/FindPlayers' element={<FindPlayers />} />
        <Route path='/Tournaments' element={<Tournaments />} />
        <Route path='/Tournaments/Create' element={<CreateTournament />} /> 
        <Route path='/how-it-works' element={<HowItWorks />} />
        <Route path='/Log_SignUp' element={<Log_SignUp />} />
        <Route path='/Profile' element={<Profile />} />
        <Route path='/messages' element={<Messages />} />
        <Route path='/PlayerProfile/:id' element={<PlayerProfile />} />
        <Route path='/BookingRequests' element={<BookingRequests />} />
        <Route path='/OwnerDashboard' element={<OwnerDashboard />} />
        <Route path='/OwnerDashboard/:ownerId' element={<OwnerDashboard />} />
        <Route path='/admin' element={<AdminPage />} />
        <Route path="/invites" element={<PlayerInvites />} />
      </Routes>
    </div>
  )
}

export default AppRoutes