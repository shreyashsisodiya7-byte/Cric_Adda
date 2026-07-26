import React, { useState } from "react";

function PaymentModal({ amount, playerName, eventName, onClose, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({ cardNumber: "", expiry: "", cvv: "" });

  const handlePayment = async () => {
    setProcessing(true);
    setTimeout(() => {
      alert(`Payment of ₹${amount} confirmed!\nBooking with ${playerName} is confirmed.`);
      onPaymentSuccess();
      onClose();
      setProcessing(false);
    }, 2000);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-[#0a1628] border border-white/15 text-white placeholder-white/35 outline-none focus:border-[#f4b942] transition-colors text-sm";

  const PaymentOption = ({ value, label, sub }) => (
    <label
      className={`flex items-center p-3.5 rounded-xl cursor-pointer transition-all ${
        paymentMethod === value
          ? "bg-[#f4b942]/10 border border-[#f4b942]/50"
          : "border border-white/10 hover:bg-white/5"
      }`}
    >
      <input
        type="radio"
        name="payment"
        value={value}
        checked={paymentMethod === value}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="mr-3 accent-[#f4b942]"
      />
      <div>
        <p className={`font-semibold text-sm ${paymentMethod === value ? "text-[#f4b942]" : "text-white"}`}>{label}</p>
        <p className="text-xs text-white/45 mt-0.5">{sub}</p>
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-[#0d1e38] rounded-2xl p-6 max-w-md w-full shadow-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Complete Payment</h2>
            <p className="text-white/45 text-xs mt-0.5">Secure payment powered by CricAdda</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Amount Summary */}
        <div
          className="p-4 rounded-xl mb-5"
          style={{ background: "rgba(244,185,66,0.08)", border: "1px solid rgba(244,185,66,0.2)" }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Event</p>
              <p className="text-white font-semibold text-sm mt-0.5">{eventName}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-xs uppercase tracking-wider">Player</p>
              <p className="text-white font-semibold text-sm mt-0.5">{playerName}</p>
            </div>
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Total Amount</span>
              <span className="text-2xl font-bold text-[#f4b942]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                ₹{amount}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-5">
          <PaymentOption value="upi" label="UPI Payment" sub="Google Pay, PhonePe, Paytm" />
          {paymentMethod === "upi" && (
            <input
              type="text"
              placeholder="Enter UPI ID (e.g., name@upi)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className={inputCls}
            />
          )}

          <PaymentOption value="card" label="Debit / Credit Card" sub="Visa, Mastercard, RuPay" />
          {paymentMethod === "card" && (
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Card Number"
                maxLength="16"
                value={cardDetails.cardNumber}
                onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                className={inputCls}
              />
              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength="5"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  className={inputCls}
                />
                <input
                  type="text"
                  placeholder="CVV"
                  maxLength="3"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          <PaymentOption value="wallet" label="CricAdda Wallet" sub="Use your wallet balance" />
        </div>

        {/* Terms */}
        <p className="text-white/35 text-xs mb-5 leading-relaxed">
          By clicking Pay, you agree to our terms and conditions. Your payment will be processed securely.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-3 rounded-xl bg-white/8 text-white/70 font-semibold text-sm hover:bg-white/15 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 px-4 py-3 rounded-xl bg-[#f4b942] text-[#0a1628] font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {processing ? "Processing…" : `Pay ₹${amount}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
