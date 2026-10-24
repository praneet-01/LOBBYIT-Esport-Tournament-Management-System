import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  ArrowRight,
  Shield,
  User,
  Mail,
  Lock,
  AtSign,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole =
    searchParams.get("role") === "Organizer" ? "Organizer" : "Player";

  const { sendOtp, verifyOtpRegister } = useAuth();

  const [step, setStep] = useState("details"); // 'details' | 'verify'
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: initialRole,
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devOtpCode, setDevOtpCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown for resend timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role,
      // If switching to organizer, clear username since organizers do not need a gamer tag
      username: role === "Organizer" ? "" : formData.username,
    });
  };

  // Step 1: Validate and send 6-digit OTP to email
  const handleInitiateRegister = async (e) => {
    e.preventDefault();
    setError("");

    const { name, username, email, password, role } = formData;
    if (!name || !email || !password || !role) {
      setError("Please fill in all required fields");
      return;
    }

    if (role === "Player" && !username) {
      setError("Please provide a gamer handle / tag");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const response = await sendOtp({
        email,
        purpose: "register",
        role,
        name,
        username: role === "Organizer" ? undefined : username,
        password,
      });

      setResendTimer(30);
      setStep("verify");
    } catch (err) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Handle 6-digit OTP inputs
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`reg-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reg-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePasteOtp = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .trim()
      .replace(/[^0-9]/g, "");
    if (pastedData.length >= 6) {
      const digits = pastedData.slice(0, 6).split("");
      setOtp(digits);
      const lastInput = document.getElementById(`reg-otp-5`);
      if (lastInput) lastInput.focus();
    }
  };

  const handleAutofillDevOtp = () => {
    if (devOtpCode) {
      const codeStr = String(devOtpCode).trim();
      if (codeStr.length === 6) {
        setOtp(codeStr.split(""));
      }
    }
  };

  // Step 2: Verify OTP and finalize registration
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the full 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const user = await verifyOtpRegister({
        email: formData.email,
        otp: otpString,
      });

      if (user.role === "Organizer") {
        navigate("/organizer/dashboard");
      } else {
        navigate("/tournaments");
      }
    } catch (err) {
      setError(err.message || "Verification failed. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      const response = await sendOtp({
        email: formData.email,
        purpose: "register",
        role: formData.role,
        name: formData.name,
        username: formData.role === "Organizer" ? undefined : formData.username,
        password: formData.password,
      });

      if (response?.devOtp) {
        setDevOtpCode(response.devOtp);
      }
      setResendTimer(30);
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-black">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block py-1">
            <img
              // src="/images/lobbyit-logo-transparent.png"
              src="/images/kriditam.jpeg"
              alt="LOBBYIT"
              className="h-12 w-auto mx-auto object-contain"
            />
          </Link>
          <h2 className="text-2xl font-black text-white font-gaming tracking-wide uppercase pt-1">
            {step === "details" ? "JOIN THE ARENA" : "VERIFY YOUR EMAIL"}
          </h2>
          <p className="text-sm text-slate-400">
            {step === "details"
              ? "Create your account to organize tournaments or compete in events"
              : `Enter the 6-digit code sent to ${formData.email}`}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#10141E] rounded-xl p-6 sm:p-8 border border-white/10 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {step === "details" ? (
            <>
              {/* Role Choice: ONLY PLAYER & ORGANIZER */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-300">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("Player")}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                      formData.role === "Player"
                        ? "bg-[#151B2A] border-cyan-500 text-white"
                        : "bg-[#0B0E17] border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${formData.role === "Player" ? "bg-cyan-500 text-black" : "bg-white/5 text-slate-400"}`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm font-gaming text-white">
                        PLAYER
                      </p>
                      <p className="text-xs text-slate-400">
                        Solo Gamer / Squad Leader
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect("Organizer")}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                      formData.role === "Organizer"
                        ? "bg-[#1F1218] border-[#E6002B] text-white"
                        : "bg-[#0B0E17] border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${formData.role === "Organizer" ? "bg-[#E6002B] text-white" : "bg-white/5 text-slate-400"}`}
                    >
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm font-gaming text-white">
                        ORGANIZER
                      </p>
                      <p className="text-xs text-slate-400">
                        Host & Manage Tournaments
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleInitiateRegister} className="space-y-3.5">
                {/* For Organizer: Gamer tag is NOT displayed, only Name, Email, Password */}
                {formData.role === "Organizer" ? (
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-300">
                      Organization / Host Name
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        name="name"
                        placeholder="Apex Esports Series or Clan Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#E6002B] transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  /* For Player: Full Name & Gamer Tag are displayed */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-slate-300">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          name="name"
                          autoComplete="name"
                          placeholder="Alex Morgan"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#E6002B] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-slate-300">
                        Gamer Handle / Tag
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          name="username"
                          autoComplete="username"
                          placeholder="ShadowHunter"
                          value={formData.username}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#E6002B] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-300">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#E6002B] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#E6002B] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-gaming disabled:opacity-50"
                >
                  {loading ? (
                    <span>Sending Verification Code...</span>
                  ) : (
                    <>
                      <span>Continue & Verify Email</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Step 2: 6-Digit OTP Verification Screen */
            <form onSubmit={handleVerifySubmit} className="space-y-5">
              {/* Back to details */}
              <button
                type="button"
                onClick={() => setStep("details")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change registration details</span>
              </button>



              {/* 6 Digit Inputs */}
              <div className="space-y-2">
                <label className="block text-center text-sm font-semibold text-slate-300">
                  Enter 6-Digit Code
                </label>
                <div
                  className="flex justify-center items-center gap-2 sm:gap-3"
                  onPaste={handlePasteOtp}
                >
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`reg-otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold rounded-lg bg-[#0B0E17] border border-white/20 text-white focus:outline-none focus:border-[#E6002B] focus:bg-[#151926] transition-colors"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-gaming disabled:opacity-50"
              >
                {loading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Verify & Complete Registration</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Resend button */}
              <div className="text-center text-sm text-slate-400">
                Didn't receive the code?{" "}
                {resendTimer > 0 ? (
                  <span className="text-slate-500">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-bold text-[#E6002B] hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="text-center pt-2 border-t border-white/10 text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-white hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
