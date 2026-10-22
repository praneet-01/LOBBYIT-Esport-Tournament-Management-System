import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, sendOtp, verifyOtpLogin } = useAuth();

  // Mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState("password");

  // Remember Me & Prefill from localStorage
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("lobbyit_remember_me") !== "false";
  });

  const [email, setEmail] = useState(() => {
    return localStorage.getItem("lobbyit_remember_identity") || "";
  });
  const [password, setPassword] = useState("");

  // OTP mode state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle Standard Password Login
  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email/username and password");
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password);

      // Persist or clear Remember Me
      if (rememberMe) {
        localStorage.setItem("lobbyit_remember_me", "true");
        localStorage.setItem("lobbyit_remember_identity", email.trim());
      } else {
        localStorage.setItem("lobbyit_remember_me", "false");
        localStorage.removeItem("lobbyit_remember_identity");
      }

      if (loggedUser.role === "Organizer") {
        navigate("/organizer/dashboard");
      } else {
        navigate("/tournaments");
      }
    } catch (err) {
      setError(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  // Step 1 of OTP Login: Send OTP
  const handleSendLoginOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otpEmail) {
      setError("Please enter your registered email address");
      return;
    }

    setLoading(true);
    try {
      const response = await sendOtp({
        email: otpEmail,
        purpose: "login",
      });

      if (response?.devOtp) {
        setDevOtpCode(response.devOtp);
      }
      setResendTimer(30);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || "Failed to send login code");
    } finally {
      setLoading(false);
    }
  };

  // Handle 6-digit OTP inputs
  const handleOtpDigitChange = (index, value) => {
    if (isNaN(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpDigitKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`login-otp-${index - 1}`);
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
      setOtpDigits(digits);
      const lastInput = document.getElementById(`login-otp-5`);
      if (lastInput) lastInput.focus();
    }
  };

  const handleAutofillDevOtp = () => {
    if (devOtpCode && devOtpCode.length === 6) {
      setOtpDigits(devOtpCode.split(""));
    }
  };

  // Step 2 of OTP Login: Verify OTP and Log In
  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    setError("");

    const otpString = otpDigits.join("");
    if (otpString.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await verifyOtpLogin({
        email: otpEmail,
        otp: otpString,
      });

      if (loggedUser.role === "Organizer") {
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

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-black">
      <div className="w-full max-w-md space-y-6">
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
            WELCOME BACK
          </h2>
          <p className="text-sm text-slate-400">
            Sign in to access tournaments, lineups, and brackets
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#10141E] rounded-xl p-6 sm:p-8 border border-white/10 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Tabs: Password vs OTP */}
          <div className="grid grid-cols-2 p-1 bg-[#0B0E17] border border-white/10 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setLoginMode("password");
                setError("");
              }}
              className={`py-1.5 text-sm font-gaming uppercase tracking-wider rounded-md font-bold transition-colors cursor-pointer ${
                loginMode === "password"
                  ? "bg-[#151926] text-white border border-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("otp");
                setError("");
              }}
              className={`py-1.5 text-sm font-gaming uppercase tracking-wider rounded-md font-bold transition-colors cursor-pointer ${
                loginMode === "otp"
                  ? "bg-[#151926] text-white border border-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Email OTP
            </button>
          </div>

          {loginMode === "password" ? (
            <>
              {/* Quick Demo Credentials */}
              <div className="p-3 rounded-lg bg-[#0B0E17] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 font-gaming uppercase tracking-wider">
                    Demo Accounts
                  </span>
                  <span className="text-xs text-slate-400">
                    1-Click Autofill
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("organizer@lobbyit.com");
                      setPassword("password123");
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-200 hover:text-white font-semibold border border-white/10 transition-colors text-sm text-center cursor-pointer font-gaming"
                  >
                    Organizer Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("team@lobbyit.com");
                      setPassword("password123");
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-200 hover:text-white font-semibold border border-white/10 transition-colors text-sm text-center cursor-pointer font-gaming"
                  >
                    Player Demo
                  </button>
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={handlePasswordLoginSubmit} autoComplete="on" className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="login-username" className="block text-sm font-semibold text-slate-300">
                    Email or Gamer Handle
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="login-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="name@gmail.com or @gamerhandle"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#E6002B] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-sm font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode("otp");
                        setOtpEmail(email);
                      }}
                      className="text-xs text-[#E6002B] hover:underline"
                    >
                      Login with OTP instead?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#E6002B] transition-colors"
                    />
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#0B0E17] border-white/20 text-[#E6002B] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#E6002B]"
                    />
                    <span>Remember my credentials on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-gaming disabled:opacity-50"
                >
                  {loading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* OTP Login Form */
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendLoginOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-300">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#E6002B] transition-colors"
                      />
                    </div>
                    <p className="text-xs text-slate-400 pt-0.5">
                      We'll send a 6-digit one-time code to authenticate you
                      instantly without a password.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-gaming disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <>
                        <span>Send Login Code</span>
                        <KeyRound className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Enter OTP */
                <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change email ({otpEmail})</span>
                  </button>

                  {devOtpCode && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                      <span>
                        🔑 Local Test Code:{" "}
                        <strong className="font-mono text-sm tracking-widest text-white">
                          {devOtpCode}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAutofillDevOtp}
                        className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer font-gaming uppercase tracking-wider"
                      >
                        Autofill Code
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-center text-sm font-semibold text-slate-300">
                      Enter 6-Digit Verification Code
                    </label>
                    <div
                      className="flex justify-center items-center gap-2"
                      onPaste={handlePasteOtp}
                    >
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`login-otp-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpDigitChange(idx, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpDigitKeyDown(idx, e)}
                          className="w-10 h-11 sm:w-12 sm:h-12 text-center font-mono text-lg font-bold rounded-lg bg-[#0B0E17] border border-white/20 text-white focus:outline-none focus:border-[#E6002B] focus:bg-[#151926] transition-colors"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpDigits.join("").length !== 6}
                    className="w-full py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-gaming disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Verifying Code...</span>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center text-xs text-slate-400">
                    Didn't receive the code?{" "}
                    {resendTimer > 0 ? (
                      <span className="text-slate-500">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendLoginOtp}
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
            </div>
          )}

          <div className="text-center pt-2 border-t border-white/10 text-sm text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-white hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
