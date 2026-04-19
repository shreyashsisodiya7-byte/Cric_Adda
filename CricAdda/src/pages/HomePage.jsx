import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function HomePage() {

const players = [
  {name:"Rahul", role:"Batsman", price:"₹2000", status:"Available"},
  {name:"Aman", role:"Bowler", price:"₹1800", status:"Tomorrow"},
  {name:"Vikas", role:"All Rounder", price:"₹2500", status:"Busy"},
  {name:"Rohit", role:"Batsman", price:"₹2200", status:"Available"}
];

return (

<div className="text-white overflow-hidden bg-linear-to-br from-[#0B1220] via-[#11182704] to-[#020617]">

{/* HERO SECTION */}

<section className="min-h-screen flex items-center px-6 md:px-24">

<div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center w-full">

<motion.div
initial={{opacity:0,x:-60}}
animate={{opacity:1,x:0}}
transition={{duration:1}}
>

<h1 className="text-4xl md:text-7xl font-bold leading-tight">
Hire Local 
<span className="bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
 Cricket Players
</span>
</h1>

<p className="text-gray-400 mt-6 text-base md:text-xl max-w-lg">
Find talented players for tournaments and matches near you.
</p>

{/* BUTTONS */}

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 md:mt-10 max-w-md">

<Link to="/FindPlayers" className="bg-linear-to-r flex justify-center items-center from-blue-500 to-purple-600 py-3 px-8 md:py-4 rounded-xl text-base md:text-lg hover:scale-105 transition  ">
🔍 Find Player
</Link>

<button className="bg-linear-to-r flex justify-center items-center from-orange-400 to-red-500 py-3 md:py-4 rounded-xl text-base md:text-lg hover:scale-105 transition">
🏏 Join Player
</button>

<button className="bg-linear-to-r flex justify-center items-center from-green-400 to-green-600 py-3 md:py-4 rounded-xl text-base md:text-lg hover:scale-105 transition">
🏆 Create Tournament
</button>

<button className="bg-linear-to-r flex justify-center items-center from-gray-700 to-gray-900 py-3 md:py-4 rounded-xl text-base md:text-lg hover:scale-105 transition">
📅 Book Match
</button>

</div>

</motion.div>

{/* HERO BALL */}

<motion.div
animate={{y:[0,-20,0]}}
transition={{repeat:Infinity,duration:3}}
className="flex justify-center"
>

<div className="w-28 h-28 md:w-48 md:h-48 bg-linear-to-r from-orange-400 to-red-500 rounded-full shadow-[0_0_40px_rgba(255,100,0,0.6)]"/>

</motion.div>

</div>

</section>



{/* CITY SEARCH */}

<section className="py-16 md:py-24 px-6 md:px-24 bg-[#121a2b89]">

<h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12">
Find Players Near You
</h2>

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto">

{["Gwalior","Indore","Bhopal","Delhi"].map(city => (

<button
key={city}
className="bg-linear-to-r from-blue-500 to-purple-600 py-3 md:py-4 rounded-xl text-sm md:text-lg hover:scale-105 transition"
>
📍 {city}
</button>

))}

</div>

</section>



{/* PLAYER CARDS */}

<section className="py-16 md:py-24 px-6 md:px-24">

<h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">
Available Players
</h2>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">

{players.map((p,i)=>(

<motion.div
key={i}
initial={{opacity:0,y:40}}
whileInView={{opacity:1,y:0}}
whileHover={{scale:1.07}}
className="bg-linear-to-b from-[#121a2bb5] to-[#0B1220] p-6 md:p-8 rounded-xl border border-gray-700 text-center"
>

<img
src="https://i.pravatar.cc/200"
className="w-20 h-20 md:w-28 md:h-28 rounded-full mx-auto"
/>

<h3 className="text-lg md:text-xl font-bold mt-4">{p.name}</h3>

<p className="text-gray-400 text-sm md:text-base">{p.role}</p>

<p className="mt-2 text-sm md:text-base">{p.price} per match</p>

<p className="text-green-400 mt-1 text-sm">{p.status}</p>

<div className="flex justify-center gap-3 mt-4 md:mt-5">

<button className="bg-linear-to-r from-blue-500 to-purple-600 px-3 md:px-4 py-2 rounded text-sm">
📞 Call
</button>

<button className="bg-[#25D366] px-3 md:px-4 py-2 rounded text-sm">
💬 WhatsApp
</button>

</div>

</motion.div>

))}

</div>

</section>



{/* BOOKING STEPS */}

<section className="py-16 md:py-24 px-6 md:px-24">

<h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">
How Booking Works
</h2>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-w-5xl mx-auto">

<div className="bg-linear-to-r from-blue-500 to-purple-600 p-8 md:p-10 rounded-xl text-center text-lg md:text-xl">
1️⃣ Select Player
</div>

<div className="bg-linear-to-r from-orange-400 to-red-500 p-8 md:p-10 rounded-xl text-center text-lg md:text-xl">
2️⃣ Choose Date
</div>

<div className="bg-linear-to-r from-green-400 to-green-600 p-8 md:p-10 rounded-xl text-center text-lg md:text-xl">
3️⃣ Confirm Booking
</div>

</div>

</section>



{/* TOP PLAYERS */}

<section className="py-16 md:py-24 px-6 md:px-24 bg-[#121a2bae] text-center">

<h2 className="text-3xl md:text-4xl font-bold mb-10 md:mb-12">
🔥 Top Players
</h2>

<div className="flex flex-col md:flex-row justify-center gap-6 md:gap-16 text-lg md:text-xl">

<div>🏏 Best Batsman</div>
<div>🎯 Best Bowler</div>
<div>⭐ Top Rated</div>

</div>

</section>



{/* FLOATING WHATSAPP */}

<div className="fixed bottom-5 right-5 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white rounded-full shadow-lg hover:scale-110">

<a href="#" className="text-2xl">💬</a>

</div>

</div>
);
}