import React from 'react'
import { useContext } from 'react'
import IntroVideo from './IntroVideo/IntroVideo'
import UniversalContext from '../context/UniversalContext'
import NavBar from './NavBar'
import AppRoutes from '../routes/AppRoutes'
import { useLocation } from 'react-router-dom'

const AppContent = () => {
    const { videoEnded, setVideoEnded } = useContext(UniversalContext)
    const Location = useLocation()
    const HideNavbar =  Location.pathname === "/Log_SignUp" ; 
    return (

        <div>
            <IntroVideo />
            {videoEnded &&
                <div className="  min-h-screen bg-[rgba(0,0,0,0.457)] ">
                {!HideNavbar && <NavBar /> }    
                    <AppRoutes  />

                </div>}

        </div>
    )
}

export default AppContent
