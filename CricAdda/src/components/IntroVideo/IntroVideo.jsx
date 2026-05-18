import React, { useContext, useEffect, useRef, useState } from "react";
import introVideo from "../../assets/color.mp4";
import UniversalContext from "../../context/UniversalContext";

const IntroVideo = ({ onFinish }) => {
  const videoRef = useRef(null);
 const {setVideoEnded} = useContext(UniversalContext)

  useEffect(() => {
    const played = sessionStorage.getItem("introPlayed");
if (played) {
  setVideoEnded(true);
  return;
}
    const video = videoRef.current;

    if (video && video.paused) {
      video.play().catch(() => {});
    }
const fallback = setTimeout(() => setVideoEnded(true), 5000);
    const handleEnd = () => {
      clearTimeout(fallback);
      video.pause();
      sessionStorage.setItem("introPlayed", "true");
      video.currentTime = video.duration;
      setVideoEnded(true);
    };

    video.addEventListener("ended", handleEnd);

    return () => {
      video.removeEventListener("ended", handleEnd);
    };
  }, []);

  return (
   <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
      >
        <source src={introVideo} type="video/mp4" />
      </video>
    </div>
  );
};

export default IntroVideo;