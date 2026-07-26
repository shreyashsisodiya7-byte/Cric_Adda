import React, { useContext, useState } from "react";
import UniversalContext from "../../context/UniversalContext";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../api";
import { GoogleLogin } from "@react-oauth/google";
import ForgotPasswordModal from "../Forgotpasswordmodal";

function Login() {
  const { setToggler } = useContext(UniversalContext);
  const { register, handleSubmit, formState: { errors }, getValues, reset } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPw, setShowForgotPw] = useState(false);
  // step 1 = credentials, step 2 = OTP, step 3 = Google new-user password creation
  const [step, setStep] = useState(1);
  const [otpValue, setOtpValue] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // ── Google pending state (for new users who need to set a password) ──────────
  const [googleCredential, setGoogleCredential] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googlePicture, setGooglePicture] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState("");
  const [showGooglePassword, setShowGooglePassword] = useState(false);

  React.useEffect(() => {
    const existing = localStorage.getItem("token");
    if (existing) {
      setError("You are already logged in.");
      setTimeout(() => navigate("/"), 1500);
    }
  }, [navigate]);

  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const saveUserAndRedirect = (result) => {
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify({
      _id: result.user._id,
      name: result.user.Fullname,
      email: result.user.Email,
      userType: result.user.userType,
    }));
    localStorage.setItem("userId", result.user._id);
    localStorage.setItem("userName", result.user.Fullname);
    navigate("/");
  };

  // ── Google: step 1 — verify credential, check if user exists ────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/user/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const result = await res.json();

      // New Google user — no account yet, must set a password first
      if (result.needsPassword) {
        setGoogleCredential(credentialResponse.credential);
        setGoogleEmail(result.email);
        setGoogleName(result.name);
        setGooglePicture(result.picture);
        setStep(3);
        return;
      }

      if (res.ok) {
        saveUserAndRedirect(result);
      } else {
        setError(result.message || "Google login failed");
      }
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Google: step 2 — submit the chosen password to finish registration ───────
  const handleGooglePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (googlePassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (googlePassword !== googleConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: googleCredential, password: googlePassword }),
      });
      const result = await res.json();
      if (res.ok && !result.needsPassword) {
        saveUserAndRedirect(result);
      } else {
        setError(result.message || "Failed to create account");
      }
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Normal login: send OTP ───────────────────────────────────────────────────
  const onCredentialsSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/user/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.Email, purpose: "login" }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.message || "Failed to send OTP"); return; }
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Normal login: verify OTP then login ─────────────────────────────────────
  const onOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = getValues();
    try {
      const verifyRes = await fetch(`${API_URL}/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.Email, otp: otpValue, purpose: "login" }),
      });
      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok) { setError(verifyResult.message || "Invalid OTP"); return; }

      const loginRes = await fetch(`${API_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: data.Email, Password: data.Password }),
      });
      const loginResult = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("token", loginResult.token);
        if (loginResult.user) {
          localStorage.setItem("user", JSON.stringify({
            _id: loginResult.user._id,
            name: loginResult.user.Fullname,
            email: loginResult.user.Email,
            userType: loginResult.user.userType,
          }));
        }
        reset();
        navigate("/");
      } else {
        setError(loginResult.message || "Login failed");
      }
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    const data = getValues();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.Email, purpose: "login" }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.message || "Failed to resend"); return; }
      setResendTimer(60);
      setOtpValue("");
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "w-full p-3 rounded-xl bg-[#0d1e38] border text-white placeholder-white/40 focus:outline-none focus:border-[#f4b942] transition-colors";

  return (
    <div className="min-h-screen select-none flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 50%,#0f2d1e 100%)" }}>

      {/* Forgot Password Modal */}
      {showForgotPw && (
        <ForgotPasswordModal
          darkTheme
          onClose={() => setShowForgotPw(false)}
          onSuccess={(msg) => { setError(""); setShowForgotPw(false); alert(msg); }}
        />
      )}

      {/* Card */}
      <div className="w-full max-w-sm sm:max-w-md bg-[#0d1e38] p-6 sm:p-8 rounded-2xl shadow-2xl text-white"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Logo mark */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#f4b942] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0a1628" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3c0 0 4 5 4 9s-4 9-4 9" />
              <path d="M3 12h18" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-1"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
          {step === 3 ? "SET YOUR PASSWORD" : "WELCOME BACK"}
        </h2>
        <p className="text-center text-white/50 text-sm mb-6">
          {step === 3
            ? `Welcome, ${googleName}! Create a password to activate your account.`
            : "Log in to your CricAdda account"}
        </p>

        {error && (
          <p className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-xl text-center mb-4 text-sm" role="alert">
            {error}
          </p>
        )}

        {/* Step indicator — only for normal login flow */}
        {step !== 3 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step >= s ? "bg-[#f4b942] text-[#0a1628]" : "bg-white/10 text-white/40"}`}>
                  {s}
                </div>
                {s < 2 && <div className={`flex-1 h-0.5 max-w-[40px] transition-all ${step > s ? "bg-[#f4b942]" : "bg-white/15"}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ── Step 1: Email + password ── */}
        {step === 1 && (
          <>
            <form onSubmit={handleSubmit(onCredentialsSubmit)} autoComplete="off" className="flex flex-col gap-4">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  {...register("Email", {
                    required: true,
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email" },
                  })}
                  className={`${inputBase} ${errors.Email ? "border-red-500" : "border-white/15"}`}
                />
                {errors.Email?.type === "required" && <p className="text-red-400 text-xs mt-1">Email required</p>}
                {errors.Email?.type === "pattern" && <p className="text-red-400 text-xs mt-1">{errors.Email.message}</p>}
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    {...register("Password", {
                      required: true,
                      minLength: { value: 8, message: "Min 8 characters" },
                    })}
                    className={`${inputBase} pr-10 ${errors.Password ? "border-red-500" : "border-white/15"}`}
                  />
                  <button type="button" onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-3.5 text-white/40 hover:text-white/80 transition-colors">
                    {showPassword ? <i className="ri-eye-off-line" /> : <i className="ri-eye-line" />}
                  </button>
                </div>
                {errors.Password?.type === "required" && <p className="text-red-400 text-xs mt-1">Password required</p>}
                {errors.Password?.type === "minLength" && <p className="text-red-400 text-xs mt-1">{errors.Password.message}</p>}
                {/* Forgot Password link */}
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPw(true)}
                    className="text-[#f4b942] text-xs hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f4b942] text-[#0a1628] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "Sending OTP…" : "Send OTP to Email"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-xs">or continue with Google</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google login failed. Please try again.")}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signin_with"
                width="100%"
              />
            </div>
          </>
        )}

        {/* ── Step 2: OTP verification ── */}
        {step === 2 && (
          <form onSubmit={onOtpSubmit} className="flex flex-col gap-4">
            <div className="text-center py-2">
              <div className="text-5xl mb-3">📧</div>
              <p className="text-white font-semibold">Check your email</p>
              <p className="text-white/45 text-sm mt-1">
                OTP sent to <span className="text-[#f4b942]">{getValues("Email")}</span>
              </p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              className="w-full p-4 rounded-xl bg-[#0a1628] border border-white/15 focus:outline-none focus:border-[#f4b942] tracking-[0.6em] text-center text-2xl font-bold text-[#f4b942] transition-colors"
            />

            <button
              type="submit"
              disabled={loading || otpValue.length < 6}
              className="w-full bg-[#f4b942] text-[#0a1628] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying…" : "Verify & Login"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep(1); setError(""); setOtpValue(""); }}
                className="text-white/50 hover:text-white transition-colors">
                ← Back
              </button>
              <button type="button" onClick={handleResend} disabled={resendTimer > 0 || loading}
                className="text-[#f4b942] hover:underline disabled:text-white/30 transition-colors">
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Google new-user password creation ── */}
        {step === 3 && (
          <form onSubmit={handleGooglePasswordSubmit} className="flex flex-col gap-4">
            {googlePicture && (
              <div className="flex justify-center mb-2">
                <img src={googlePicture} alt={googleName}
                  className="w-16 h-16 rounded-full border-2 border-[#f4b942]" />
              </div>
            )}
            <p className="text-center text-white/60 text-xs -mt-2 mb-1">{googleEmail}</p>

            <div>
              <div className="relative">
                <input
                  type={showGooglePassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={googlePassword}
                  onChange={(e) => setGooglePassword(e.target.value)}
                  className={`${inputBase} pr-10 border-white/15`}
                />
                <button type="button" onClick={() => setShowGooglePassword((p) => !p)}
                  className="absolute right-3 top-3.5 text-white/40 hover:text-white/80 transition-colors">
                  {showGooglePassword ? <i className="ri-eye-off-line" /> : <i className="ri-eye-line" />}
                </button>
              </div>
              <p className="text-white/30 text-xs mt-1">At least 6 characters</p>
            </div>

            <div className="relative">
              <input
                type={showGooglePassword ? "text" : "password"}
                placeholder="Confirm password"
                value={googleConfirmPassword}
                onChange={(e) => setGoogleConfirmPassword(e.target.value)}
                className={`${inputBase} pr-10 border-white/15`}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googlePassword.length < 6}
              className="w-full bg-[#f4b942] text-[#0a1628] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account…" : "Create Account & Login"}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setError(""); setGooglePassword(""); setGoogleConfirmPassword(""); }}
              className="text-white/50 hover:text-white text-sm transition-colors text-center"
            >
              ← Use a different method
            </button>
          </form>
        )}

        <p className="text-center text-white/45 mt-6 text-sm">
          Don't have an account?{" "}
          <button onClick={() => setToggler((p) => !p)} className="text-[#f4b942] font-semibold hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;