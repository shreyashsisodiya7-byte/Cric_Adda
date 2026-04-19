import React, { useContext } from 'react'
import SignUp from '../components/User/SignUp'
import UniversalContext from '../context/UniversalContext'
import Login from '../components/User/LogIn'


const Log_SignUp = () => {
  const { toggler } = useContext(UniversalContext)
  return (
    <div>
      {toggler ? <SignUp /> : <Login />}
    </div>
  )
}

export default Log_SignUp
