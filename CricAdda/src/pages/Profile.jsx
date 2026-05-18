import React, { useState, useEffect } from "react";
import {useNavigate} from "react-router-dom"
import axios from "axios"
import { useContext } from "react";
import UniversalContext from "../context/UniversalContext";
import { API_URL, UPLOADS_URL } from "../api";

export default function PlayerProfile() {

const [available,setAvailable] = useState(true)
const [editMode, setEditMode] = useState(false)
const [name, setName] = useState('Player Name')
const [userType, setUserType] = useState('Player')
const [role, setRole] = useState('🏏 Batsman')
const [city, setCity] = useState('City')
const [fee, setFee] = useState('Fee')
const [note, setNote] = useState('')
const [about, setAbout] = useState('')
const [stats, setStats] = useState({matches: 0, runs: 0, wickets: 0, strikeRate: 0})
const [availability, setAvailability] = useState(Array(10).fill(false))
const [next10Days, setNext10Days] = useState([])
const [loading, setLoading] = useState(true)
const [Photo, setPhoto] = useState("")
const [file, setFile] = useState(null)

const {setToken} = useContext(UniversalContext)

const calculatedStrikeRate = (stats.runs / stats.matches).toFixed(2);

const Navigate = useNavigate();

useEffect(() => {

   const loadProfile = async ()=>{

    try{

      const user = JSON.parse(localStorage.getItem("user"));

      const res = await axios.get(

        `${API_URL}/players/profile/${user._id}`

      );

      const data = res.data.data;

      if (data) {
        setName(data.name || "Player Name");
        setUserType(data.userType || "Player");
        setRole(data.role || "🏏 Batsman");
        setCity(data.city || "City");
        setFee(data.fee ?? "");
        setNote(data.note ?? "");
        setAbout(data.about ?? "");

        setStats({
          matches: data.stats?.matches ?? 0,
          runs: data.stats?.runs ?? 0,
          wickets: data.stats?.wickets ?? 0,
          strikeRate: 0,
        });
        const availabilityArray = Array.isArray(data.availability)
          ? data.availability
          : Array(10).fill(false);
        setAvailability(availabilityArray);

        const photoUrl = data.photo
          ? data.photo.startsWith("http")
            ? data.photo
            : `${UPLOADS_URL}/${data.photo}`
          : "";
        setPhoto(photoUrl);
      }

    }catch(error){

      console.log(error)

    }finally{
      setLoading(false)
    }

  }

  loadProfile() 

  const updateDates = () => {
    const dates = Array.from({length: 10}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toLocaleDateString();
    });
    setNext10Days(dates);
  };

  updateDates();

  const interval = setInterval(updateDates, 24 * 60 * 60 * 1000); 
  return () => clearInterval(interval);

  
}, []);

const saveProfile = async () => {
  

  try {

    const user = JSON.parse(localStorage.getItem("user"));
    console.log("User ID:", user?._id);

    const formData = new FormData();

    formData.append("name", name);
    formData.append("userType", userType);
    formData.append("role", role);
    formData.append("city", city);
    formData.append("fee", fee);
    formData.append("note", note);
    formData.append("about", about);
    formData.append("stats", JSON.stringify(stats));
    formData.append("availability", JSON.stringify(availability));
    if (file){
      formData.append("photo", file);
    }
    
    await axios.put(
      
      `${API_URL}/players/update/${user._id}`,
      formData
    )

    setEditMode(false);

    alert("Profile Saved");

  } catch (error) {

    console.log(error);

  }
  
};



const UserLogout = ()=>{

  localStorage.removeItem("token")
  localStorage.removeItem("user")

  setToken("")
  Navigate("/Log_SignUp")
}



return(

<div className="min-h-screen mt-8 text-white bg-linear-to-br from-[#020617] via-[#0B1220] to-[#020617] px-6 md:px-24 py-12">

{/* PROFILE TOP */}

<div className="bg-[#0B1220] p-8 rounded-2xl border border-gray-700 grid md:grid-cols-4 gap-10">

{/* PHOTO */}

<div className="flex flex-col items-center">

<img
src={Photo || "https://i.pravatar.cc/300"}
className="w-40 h-40 rounded-full border-4 border-[#3B82F6]"
/>

{editMode && <label className="mt-4 bg-linear-to-r from-[#3B82F6] to-[#8B5CF6] px-4 py-2 rounded-lg">
📷 Change Photo
<input type="file" hidden onChange={(e) => {
  if (!e.target.files || e.target.files.length === 0) return;

  const selectedFile = e.target.files[0];

  setFile(selectedFile);
  setPhoto(URL.createObjectURL(selectedFile));
}} />
</label>}

</div>

{/* BASIC INFO */}

<div className="md:col-span-2 space-y-4 flex flex-col gap-2">

{editMode ? (
<input
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700"
/>
) : (
<p className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700">{name}</p>
)}

<select value={userType} onChange={(e)=>setUserType(e.target.value)} disabled={!editMode} className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700">
<option>Player</option>
<option>Owner</option>
</select>

<select value={role} onChange={(e)=>setRole(e.target.value)} disabled={!editMode} className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700">

<option>Batsman</option>
<option>Bowler</option>
<option>All Rounder</option>
<option>Wicket Keeper</option>

</select>

{editMode ? (
<input
value={city}
onChange={(e)=>setCity(e.target.value)}
placeholder="📍 City"
className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700"
/>
) : (
<p className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700">{city}</p>
)}

{editMode ? (
<input
value={fee}
onChange={(e)=>setFee(e.target.value)}
placeholder="💰 Fee Per Match"
className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700"
/>
) : (
<p className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700">{fee}</p>
)}

{editMode ? (
<textarea
value={note}
onChange={(e)=>setNote(e.target.value)}
placeholder="📝 Write a note about yourself"
className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700 h-20"
/>
) : (
<p className="w-full p-3 rounded-lg bg-[#020617] border border-gray-700">{note || 'No note added'}</p>
)}

</div>

</div>


{/* QUICK ACTIONS */}

<div className="grid md:grid-cols-2 gap-6 mt-12">

<button className="bg-linear-to-r from-[#3B82F6] to-[#8B5CF6] p-6 rounded-xl text-lg">
📅 My Bookings
</button>

<button className="bg-linear-to-r from-[#F97316] to-[#8B5CF6] p-6 rounded-xl text-lg">
🏆 My Matches
</button>

</div>


{/* ABOUT PLAYER */}

<div className="mt-14">

<h2 className="text-3xl font-bold mb-6">📖 About Player</h2>

{editMode ? (
<textarea
value={about}
onChange={(e)=>setAbout(e.target.value)}
placeholder="Write about yourself, your experience, achievements, etc."
className="w-full p-4 bg-[#020617] rounded-lg border border-gray-700 h-32"
/>
) : (
<p className="p-4 bg-[#020617] rounded-lg border border-gray-700">{about || 'No information added yet.'}</p>
)}

</div>


{/* MATCH STATS */}

<div className="mt-16">

<h2 className="text-3xl font-bold mb-8">📊 My Performance</h2>

<div className="grid md:grid-cols-4 gap-8">

<div className="bg-[#0B1220] p-8 rounded-xl text-center border border-gray-700">
{editMode ? (
<input 
type="number"
value={stats.matches} 
onChange={(e)=>setStats(prev=>({...prev, matches: e.target.value}))} 
className="w-full text-center bg-[#0B1220] text-[#3B82F6] text-3xl border-none outline-none"
/>
) : (
<h3 className="text-3xl text-[#3B82F6]">{stats.matches}</h3>
)}
<p>Matches</p>
</div>

<div className="bg-[#0B1220] p-8 rounded-xl text-center border border-gray-700">
{editMode ? (
<input 
type="number"
value={stats.runs} 
onChange={(e)=>setStats(prev=>({...prev, runs: e.target.value}))} 
className="w-full text-center bg-[#0B1220] text-[#22C55E] text-3xl border-none outline-none"
/>
) : (
<h3 className="text-3xl text-[#22C55E]">{stats.runs}</h3>
)}
<p>Runs</p>
</div>

<div className="bg-[#0B1220] p-8 rounded-xl text-center border border-gray-700">
{editMode ? (
<input 
type="number"
value={stats.wickets} 
onChange={(e)=>setStats(prev=>({...prev, wickets: e.target.value}))} 
className="w-full text-center bg-[#0B1220] text-[#F97316] text-3xl border-none outline-none"
/>
) : (
<h3 className="text-3xl text-[#F97316]">{stats.wickets}</h3>
)}
<p>Wickets</p>
</div>

<div className="bg-[#0B1220] p-8 rounded-xl text-center border border-gray-700">
<h3 className="text-3xl text-[#8B5CF6]">{calculatedStrikeRate}</h3>
<p>Strike Rate</p>
</div>

</div>

</div>


{/* AVAILABILITY */}

<div className="mt-16">

<h2 className="text-3xl font-bold mb-8">📅 Availability (Next 10 Days)</h2>

<div className="grid md:grid-cols-5 gap-4">

{next10Days.map((day, index) => (
<div key={index} className="bg-[#0B1220] p-4 rounded-xl text-center border border-gray-700">
<p className="mb-2">{day}</p>
{editMode ? (
<input
type="checkbox"
checked={availability[index]}
onChange={(e)=>setAvailability(prev => {
  const base = Array.isArray(prev) ? prev : Array(10).fill(false);
  return base.map((a,i) => (i === index ? e.target.checked : a));
})}
className="w-6 h-6"
/>
) : (
<span className={availability[index] ? "text-green-400" : "text-red-400"}>
{availability[index] ? "✅ Available" : "❌ Busy"}
</span>
)}
</div>
))}

</div>

</div>


{/* SAVE BUTTON */}

<div className="flex justify-center mt-16 gap-4">

<button onClick={()=>setEditMode(!editMode)} className="bg-linear-to-r from-[#F97316] to-[#8B5CF6] px-10 py-4 text-xl rounded-xl">
{editMode ? 'Cancel' : 'Edit'}
</button>

{editMode && (
<button onClick={()=>(saveProfile())} className="bg-linear-to-r from-[#22C55E] to-[#3B82F6] px-10 py-4 text-xl rounded-xl">
💾 Save Profile
</button>
)}

<button onClick={()=>{UserLogout()}} className="bg-linear-to-r from-[#c60919] to-[#740303] px-10 py-4 text-xl rounded-xl">
Log out
</button>

</div>

</div>

)
}