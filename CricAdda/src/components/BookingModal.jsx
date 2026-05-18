import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../api";

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

  // Update eventDate when date prop changes
  useEffect(() => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        eventDate: date,
      }));
    }
  }, [date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.eventName || !formData.eventDate) {
        setError("Event name and date are required");
        setLoading(false);
        return;
      }

      // Check if owner info is available
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

      console.log("Booking data being sent:", bookingData);
      console.log("API URL:", `${API_URL}/bookings/request`);

      // Create booking request
      const response = await axios.post(
        `${API_URL}/bookings/request`,
        bookingData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Booking response:", response.data);

      if (response.data.success) {
        alert("Booking request sent! Waiting for player confirmation.");
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || "Failed to send booking request");
      }
    } catch (err) {
      console.error("Full Booking error:", err);
      console.error("Error response:", err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Error sending booking request";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto hide-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Book {playerName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-500 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              placeholder="e.g., City Championship 2026"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Date *
            </label>
            {date ? (
              <input
                type="text"
                value={formData.eventDate}
                disabled
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none border border-green-500"
              />
            ) : (
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}
          </div>

          {/* Event Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Location
            </label>
            <input
              type="text"
              name="eventLocation"
              value={formData.eventLocation}
              onChange={handleChange}
              placeholder="e.g., Delhi Cricket Stadium"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Type
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="match">Match</option>
              <option value="tournament">Tournament</option>
              <option value="practice">Practice</option>
              <option value="trial">Trial</option>
            </select>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Offer Amount (₹)
            </label>
            <input
              type="number"
              name="paymentAmount"
              value={formData.paymentAmount}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            {playerFee && (
              <p className="text-xs text-gray-400 mt-1">
                Player's standard fee: ₹{playerFee}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message to Player
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell the player about your event..."
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;
