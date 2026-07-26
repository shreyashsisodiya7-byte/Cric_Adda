import React, { useState, useEffect,useContext } from "react";
import axios from "axios";
import { API_URL } from "../api";
import UniversalContext from "../context/UniversalContext";

function BookingModal({ playerId, playerName, playerFee, onClose, onSuccess, ownerId, ownerName, ownerCity, date }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: date || "",
    eventLocation: "",
    eventType: "match",
    message: "",
    fee: playerFee || "",
    notes: "",
    paymentAmount: playerFee || "",
  });
  const { setModalOpen } = useContext(UniversalContext);

  useEffect(() => {
  setModalOpen(true);
  return () => setModalOpen(false); 
}, [setModalOpen]);

  useEffect(() => {
    if (date) setFormData((prev) => ({ ...prev, eventDate: date }));
  }, [date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.eventName || !formData.eventDate) {
        setError("Event name and date are required");
        setLoading(false);
        return;
      }
      if (!ownerId || !ownerName) {
        setError("Please login first before booking a player");
        setLoading(false);
        return;
      }

      const bookingData = {
        ownerId: ownerId.toString().trim(),
        ownerName: ownerName.toString().trim(),
        ownerCity: (ownerCity || "").toString().trim(),
        playerId: playerId.toString().trim(),
        playerName: playerName.toString().trim(),
        eventName: formData.eventName.trim(),
        eventDate: formData.eventDate,
        eventLocation: (formData.eventLocation || "").trim(),
        eventType: formData.eventType,
        message: (formData.message || "").trim(),
        fee: parseInt(formData.fee) || 0,
        notes: (formData.notes || "").trim(),
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/bookings/request`, bookingData, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        alert("Booking request sent! Waiting for player confirmation.");
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || "Failed to send booking request");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Error sending booking request";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-[#0d1e38] border border-white/15 text-white placeholder-white/35 outline-none focus:border-[#f4b942] transition-colors text-sm";
  const labelCls = "block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-[#0d1e38] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto hide-scrollbar shadow-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Book {playerName}</h2>
            <p className="text-white/45 text-xs mt-0.5">Fill in the event details below</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Event Name *</label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              placeholder="e.g., City Championship 2026"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Event Date *</label>
            {date ? (
              <input
                type="text"
                value={formData.eventDate}
                disabled
                className={`${inputCls} border-[#f4b942]/40 text-[#f4b942] opacity-80 cursor-not-allowed`}
              />
            ) : (
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className={inputCls}
                required
              />
            )}
          </div>

          <div>
            <label className={labelCls}>Event Location</label>
            <input
              type="text"
              name="eventLocation"
              value={formData.eventLocation}
              onChange={handleChange}
              placeholder="e.g., Delhi Cricket Stadium"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Event Type</label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="match">Match</option>
              <option value="tournament">Tournament</option>
              <option value="practice">Practice</option>
              <option value="trial">Trial</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Offer Amount (₹)</label>
            <input
              type="number"
              name="paymentAmount"
              value={formData.paymentAmount}
              onChange={handleChange}
              placeholder="0"
              className={inputCls}
            />
            {playerFee && (
              <p className="text-white/40 text-xs mt-1">Player's standard fee: <span className="text-[#f4b942]">₹{playerFee}</span></p>
            )}
          </div>

          <div>
            <label className={labelCls}>Message to Player</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell the player about your event…"
              className={`${inputCls} resize-none h-20`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 text-white/70 font-semibold text-sm hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#f4b942] text-[#0a1628] font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;
