import React, { useState, useEffect } from "react";
import { API_URL } from "../api";

function ForgotPasswordModal({ onClose, onSuccess, darkTheme = false }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: verify email exists → send OTP ──────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "forgot-password" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to send OTP."); return; }
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ───────────────────────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length < 6) { setError("Please enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, purpose: "forgot-password" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Invalid OTP."); return; }
      setStep(3);
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "forgot-password" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to resend."); return; }
      setResendTimer(60);
      setOtp("");
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: reset password ───────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to reset password."); return; }
      onSuccess("Password reset successfully! 🎉");
      onClose();
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Theme helpers ────────────────────────────────────────────────────────────
  const overlay = darkTheme
    ? "fixed inset-0 z-[600] flex items-center justify-center p-4"
    : "fixed inset-0 z-[600] flex items-center justify-center p-4";
  const overlayBg = darkTheme ? "rgba(5,10,20,0.85)" : "rgba(10,22,40,0.7)";

  const cardCls = darkTheme
    ? "w-full max-w-sm bg-[#0d1e38] rounded-2xl p-7 shadow-2xl text-white"
    : "w-full max-w-sm bg-white rounded-2xl p-7 shadow-2xl";
  const cardBorder = darkTheme ? "1px solid rgba(255,255,255,0.1)" : "1.5px solid #e8edf2";

  const titleCls = darkTheme ? "text-white" : "text-[#0a1628]";
  const inputCls = darkTheme
    ? "w-full px-4 py-3 rounded-xl bg-[#0a1628] border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#f4b942] transition-colors"
    : "w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#e8edf2] bg-[#f8fafc] text-[#0a1628] outline-none focus:border-[#f4b942] transition-colors";
  const labelCls = darkTheme
    ? "block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1"
    : "block text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-1.5";
  const cancelBtnCls = darkTheme
    ? "flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80 bg-white/10 text-white/60 border-none"
    : "flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80 bg-[#f4f7fb] border border-[#e8edf2] text-[#607080]";
  const primaryBtnCls = "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 bg-[#f4b942] text-[#0a1628] border-none";

  const stepTitles = ["Forgot Password", "Verify OTP", "Set New Password"];
  const stepIcons  = ["🔑", "📧", "🔒"];

  return (
    <div className={overlay} style={{ background: overlayBg }}>
      <div className={cardCls} style={{ border: cardBorder }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{stepIcons[step - 1]}</span>
            <h2 className={`text-xl font-bold ${titleCls}`} style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", fontSize: "1.4rem" }}>
              {stepTitles[step - 1]}
            </h2>
          </div>
          <button onClick={onClose}
            className={`text-xl font-bold cursor-pointer bg-transparent border-none ${darkTheme ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-600"} transition-colors`}>
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                ${step >= s ? "bg-[#f4b942] text-[#0a1628]" : darkTheme ? "bg-white/10 text-white/30" : "bg-[#e8edf2] text-[#9ca3af]"}`}>
                {step > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-0.5 transition-all ${step > s ? "bg-[#f4b942]" : darkTheme ? "bg-white/10" : "bg-[#e8edf2]"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/20 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* ── Step 1: Email entry ── */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <p className={`text-sm ${darkTheme ? "text-white/55" : "text-[#607080]"}`}>
              Enter the email address linked to your account. We'll send a one-time password.
            </p>
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-1">
              <button type="button" onClick={onClose} className={cancelBtnCls}>Cancel</button>
              <button type="submit" disabled={loading || !email} className={primaryBtnCls}>
                {loading ? "Sending OTP…" : "Send OTP"}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2: OTP entry ── */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            <div className="text-center py-1">
              <div className="text-4xl mb-2">📧</div>
              <p className={`text-sm font-medium ${darkTheme ? "text-white" : "text-[#0a1628]"}`}>Check your inbox</p>
              <p className={`text-xs mt-1 ${darkTheme ? "text-white/45" : "text-[#9ca3af]"}`}>
                OTP sent to <span className="text-[#f4b942] font-semibold">{email}</span>
              </p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className={`w-full p-4 rounded-xl border focus:outline-none focus:border-[#f4b942] tracking-[0.6em] text-center text-2xl font-bold text-[#f4b942] transition-colors ${darkTheme ? "bg-[#0a1628] border-white/15" : "bg-[#f8fafc] border-[#e8edf2]"}`}
              autoFocus
            />

            <button type="submit" disabled={loading || otp.length < 6} className={primaryBtnCls + " w-full"}>
              {loading ? "Verifying…" : "Verify OTP"}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={() => { setStep(1); setError(""); setOtp(""); }}
                className={`cursor-pointer bg-transparent border-none ${darkTheme ? "text-white/50 hover:text-white" : "text-[#9ca3af] hover:text-[#0a1628]"} transition-colors`}>
                ← Change email
              </button>
              <button type="button" onClick={handleResend} disabled={resendTimer > 0 || loading}
                className="text-[#f4b942] hover:underline disabled:text-gray-400 transition-colors cursor-pointer bg-transparent border-none">
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: New password ── */}
        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <p className={`text-sm ${darkTheme ? "text-white/55" : "text-[#607080]"}`}>
              Create a strong new password for your account.
            </p>
            <div>
              <label className={labelCls}>New Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={inputCls + " pr-10"}
                  autoFocus
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-sm ${darkTheme ? "text-white/40 hover:text-white/80" : "text-gray-400 hover:text-gray-600"}`}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div className="mt-1.5 flex gap-1 items-center">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                      style={{ background: newPassword.length >= i * 2 ? (newPassword.length >= 8 ? "#059669" : newPassword.length >= 6 ? "#f4b942" : "#ef4444") : "#e8edf2" }} />
                  ))}
                  <span className="text-[10px] text-gray-400 ml-1">
                    {newPassword.length >= 8 ? "Strong" : newPassword.length >= 6 ? "Medium" : "Weak"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className={inputCls}
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <div className="flex gap-3 mt-1">
              <button type="button" onClick={onClose} className={cancelBtnCls}>Cancel</button>
              <button type="submit" disabled={loading || newPassword.length < 6} className={primaryBtnCls}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordModal;