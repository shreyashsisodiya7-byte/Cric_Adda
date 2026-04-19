import React, { useState ,useEffect} from "react";
import axios from "axios"

 function FindPlayer() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("")
  const [role, setRole] = useState("All");
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  

 useEffect(() => {
  const AllPlayers = async () => {
    try {
      const res = await axios.get(
      `http://localhost:3000/players/all`
    );
    setPlayers(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const updatedDate = ()=> {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }
  updatedDate();
  AllPlayers();
 }, [])
 
 const filteredPlayers = players.filter((p) => {
    const playerDate = new Date(p.createdAt).toISOString().split("T")[0];
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (role === "All" || p.role === role) &&
      p.availability === true &&
      (date === "" || playerDate === date) 
    );
  });

  return (
    <div className="min-h-screen bg-gray-900 pt-20 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Find Players</h1>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl bg-gray-800 outline-none"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-4 py-2 rounded-xl  bg-gray-800 w-full md:w-auto md:flex "
        >
          <option className="text-[16px] overflow-hidden">All</option>
          <option className="text-[16px] overflow-hidden">Batsman</option>
          <option className="text-[16px] overflow-hidden">Bowler</option>
          <option className="text-[16px] overflow-hidden">All-Rounder</option>
        </select>

        <input
          type="date"
          placeholder="Search player..."
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 rounded-xl bg-gray-800 outline-none"
        />
      </div>
      

      {/* Player Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPlayers.map((player, index) => (
          <div
            key={index}
            className="bg-gray-800 p-5 rounded-2xl shadow-lg"
          >
            <h2 className="text-xl font-semibold">{player.name}</h2>
            <p className="text-gray-400">{player.role}</p>

            <div
              className={`mt-4 px-4 py-2 rounded-xl text-center ${
                player.available
                  ? "bg-linear-to-r from-green-500 to-blue-500"
                  : "bg-gray-700"
              }`}
            >
              {player.available ? "Available" : "Not Available"}
            </div>

            <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-xl">
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default FindPlayer
