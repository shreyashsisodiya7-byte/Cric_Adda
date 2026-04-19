import React, { useState } from 'react'
import UniversalContext from './UniversalContext'

const VideoState = (props) => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [toggler, setToggler] = useState(true)
  const [token, setToken] = useState("")

  return (
    <UniversalContext.Provider value={{ videoEnded, setVideoEnded, toggler, setToggler, token, setToken }} >
      {props.children}
    </UniversalContext.Provider>
  )
}

export default VideoState
