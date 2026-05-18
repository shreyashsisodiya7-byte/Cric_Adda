import React from 'react'
import {Routes,Route} from 'react-router-dom'
import HomePage from '../pages/HomePage'
import FindPlayers from '../pages/FindPlayers'
import Tournaments from '../pages/Tournaments'
import How_It_Works from '../pages/How_It_Works'
import Log_SignUp from '../pages/Log_SignUp'
import Profile from '../pages/Profile'
import PlayerProfile from '../pages/PlayerProfile'
import BookingRequests from '../pages/BookingRequests'
import Messages from '../pages/Messages'

const AppRoutes = () => {
  return (
    <div>
        <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/FindPlayers' element={<FindPlayers />} />
            <Route path='/Tournaments' element={<Tournaments />} /> 
            <Route path='/How_It_Works' element={<How_It_Works />} />
            <Route path='/Log_SignUp' element={ <Log_SignUp />} />
            <Route path='/Profile' element={<Profile />} />
            <Route path='/messages' element={<Messages />} />
            <Route path='/PlayerProfile/:id' element={<PlayerProfile />} />
            <Route path='/BookingRequests' element={<BookingRequests />} />
        </Routes>
    </div>
  )
}

export default AppRoutes
