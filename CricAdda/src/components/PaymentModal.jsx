import React, { useState } from "react";

function PaymentModal({ amount, playerName, eventName, onClose, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const handlePayment = async () => {
    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      alert(`Payment of ₹${amount} confirmed!\nBooking with ${playerName} is confirmed.`);
      onPaymentSuccess();
      onClose();
      setProcessing(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Amount Summary */}
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <p className="text-gray-300 text-sm">Event: {eventName}</p>
          <p className="text-gray-300 text-sm">Player: {playerName}</p>
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xl font-bold text-green-400">
              Total Amount: ₹{amount}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4 mb-6">
          <label className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700">
            <input
              type="radio"
              name="payment"
              value="upi"
              checked={paymentMethod === "upi"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div>
              <p className="font-medium text-white">UPI Payment</p>
              <p className="text-sm text-gray-400">Google Pay, PhonePe, Paytm</p>
            </div>
          </label>

          {paymentMethod === "upi" && (
            <input
              type="text"
              placeholder="Enter UPI ID (e.g., name@upi)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <label className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700">
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div>
              <p className="font-medium text-white">Debit/Credit Card</p>
              <p className="text-sm text-gray-400">Visa, Mastercard, RuPay</p>
            </div>
          </label>

          {paymentMethod === "card" && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Card Number"
                maxLength="16"
                value={cardDetails.cardNumber}
                onChange={(e) =>
                  setCardDetails({ ...cardDetails, cardNumber: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength="5"
                  value={cardDetails.expiry}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, expiry: e.target.value })
                  }
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  maxLength="3"
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, cvv: e.target.value })
                  }
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <label className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700">
            <input
              type="radio"
              name="payment"
              value="wallet"
              checked={paymentMethod === "wallet"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div>
              <p className="font-medium text-white">Wallet</p>
              <p className="text-sm text-gray-400">CricAdda Wallet Balance</p>
            </div>
          </label>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-6 text-xs text-gray-400">
          <p>
            By clicking Pay, you agree to the terms and conditions. Your payment
            will be processed securely.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-bold transition"
          >
            {processing ? "Processing..." : `Pay ₹${amount}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
