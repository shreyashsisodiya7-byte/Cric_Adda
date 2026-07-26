import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const HomePage = lazy(() => import('../pages/HomePage'))
const FindPlayers = lazy(() => import('../pages/FindPlayers'))
const Tournaments = lazy(() => import('../pages/TournamentsSquad'))
const CreateTournament = lazy(() => import('../pages/CreateTournament'))
const Log_SignUp = lazy(() => import('../pages/Log_SignUp'))
const Profile = lazy(() => import('../pages/Profile'))
const PlayerProfile = lazy(() => import('../pages/PlayerProfile'))
const BookingRequests = lazy(() => import('../pages/BookingRequests'))
const Messages = lazy(() => import('../pages/Messages'))
const OwnerDashboard = lazy(() => import('../pages/OwnerDashboard'))
const AdminPage = lazy(() => import('../components/AdminPage'))
const HowItWorks = lazy(() => import('../pages/How_It_Works'))
const PlayerInvites = lazy(() => import('../pages/PlayerInvites'))

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
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
          <Route path='/invites' element={<PlayerInvites />} />
        </Routes>
      </div>
    </Suspense>
  )
}

export default AppRoutes