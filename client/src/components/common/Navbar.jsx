import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  Users,
  LogOut,
  Menu,
  X,
  PlusCircle,
  User,
  Trophy,
  Gamepad2,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const { user, logout, isOrganizer, isTeam, isPlayer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setUserDropdownOpen(false);
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Brand Logo - 100% transparent PNG with unified navbar background */}
          <Link to="/" className="flex items-center group py-2">
            <img
              // src="/images/lobbyit-logo-transparent.png"
              src="/images/kriditam.jpeg"
              alt="LOBBYIT"
              className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-102"
              onError={(e) => {
                // e.currentTarget.src = '/images/lobbyit-icon.png';
                e.currentTarget.src = "/images/kriditam-logo.jpeg";
              }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-colors ${
                isActive("/")
                  ? "text-white bg-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Home
            </Link>
            <Link
              to="/tournaments"
              className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-colors ${
                isActive("/tournaments")
                  ? "text-white bg-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Tournaments
            </Link>
            <Link
              to="/games"
              className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-colors ${
                isActive("/games")
                  ? "text-white bg-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Games
            </Link>

            {/* If player/team is logged in, show 'My Matches'. If guest, show 'How It Works' */}
            {user && !isOrganizer ? (
              <Link
                to="/my-matches"
                className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
                  isActive("/my-matches")
                    ? "text-white bg-[#E6002B] shadow-sm"
                    : "text-amber-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                My Matches
              </Link>
            ) : !user ? (
              <a
                href="/#features"
                className="px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                How It Works
              </a>
            ) : null}
          </nav>

          {/* Right Action Buttons - Clean, Solid & Professional */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Organizer Actions */}
                {isOrganizer && (
                  <>
                    <Link
                      to="/organizer/tournaments/create"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Host Tournament
                    </Link>
                    <Link
                      to="/organizer/dashboard"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-200 font-semibold text-xs border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-cyan-400" /> Dashboard
                    </Link>
                  </>
                )}

                {/* Player / Team Actions */}
                {!isOrganizer && (
                  <Link
                    to="/tournaments"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" /> Compete
                  </Link>
                )}

                {/* User Dropdown Badge */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    onBlur={() =>
                      setTimeout(() => setUserDropdownOpen(false), 200)
                    }
                    className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-[#141824] border border-white/10 hover:border-white/20 transition-colors focus:outline-none"
                  >
                    <img
                      src={
                        user.avatar ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`
                      }
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-white/20"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white max-w-[90px] truncate leading-tight">
                        {user.name}
                      </span>
                      <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 py-2 bg-[#10141E] border border-white/10 rounded-xl shadow-xl z-50">
                      <div className="px-4 py-2.5 border-b border-white/10">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          Signed in as
                        </p>
                        <p className="text-sm font-bold text-white truncate">
                          {user.username}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-white/10 text-cyan-400">
                          {user.role}
                        </span>
                      </div>

                      {isOrganizer ? (
                        <>
                          <Link
                            to="/organizer/dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
                          >
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />{" "}
                            Dashboard
                          </Link>
                          <Link
                            to="/organizer/tournaments"
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
                          >
                            <Trophy className="w-3.5 h-3.5 text-red-500" /> My
                            Tournaments
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/my-matches"
                            className="flex items-center gap-2 px-4 py-2 text-xs text-amber-300 hover:bg-white/5 font-bold"
                          >
                            <Gamepad2 className="w-3.5 h-3.5 text-[#E6002B]" />{" "}
                            My Matches & Rooms
                          </Link>
                          <Link
                            to="/tournaments"
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
                          >
                            <Trophy className="w-3.5 h-3.5 text-cyan-400" />{" "}
                            Browse Tournaments
                          </Link>
                          <Link
                            to="/team/my-team"
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
                          >
                            <Users className="w-3.5 h-3.5 text-slate-400" />{" "}
                            Team / Squad Roster
                          </Link>
                        </>
                      )}

                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" /> Profile
                        Settings
                      </Link>

                      <div className="pt-1 mt-1 border-t border-white/10">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg bg-[#141824] text-slate-300 hover:text-white border border-white/10 focus:outline-none"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0A0D14] border-t border-white/10 py-4 px-6 space-y-3">
          <nav className="flex flex-col gap-1 font-semibold text-xs uppercase tracking-wider">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={`py-2 px-3 rounded-lg ${isActive("/") ? "bg-white/10 text-white" : "text-slate-300"}`}
            >
              Home
            </Link>
            <Link
              to="/tournaments"
              onClick={() => setMobileOpen(false)}
              className={`py-2 px-3 rounded-lg ${isActive("/tournaments") ? "bg-white/10 text-white" : "text-slate-300"}`}
            >
              Tournaments
            </Link>
            <Link
              to="/games"
              onClick={() => setMobileOpen(false)}
              className={`py-2 px-3 rounded-lg ${isActive("/games") ? "bg-white/10 text-white" : "text-slate-300"}`}
            >
              Games
            </Link>
            {user && !isOrganizer ? (
              <Link
                to="/my-matches"
                onClick={() => setMobileOpen(false)}
                className={`py-2 px-3 rounded-lg flex items-center gap-2 ${isActive("/my-matches") ? "bg-[#E6002B] text-white" : "text-amber-300"}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                My Matches
              </Link>
            ) : !user ? (
              <a
                href="/#features"
                onClick={() => setMobileOpen(false)}
                className="py-2 px-3 rounded-lg text-slate-300"
              >
                How It Works
              </a>
            ) : null}
          </nav>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            {user ? (
              <>
                <div className="flex items-center gap-3 p-2.5 bg-[#141824] rounded-lg border border-white/10">
                  <img
                    src={
                      user.avatar ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-cyan-400 uppercase font-semibold">
                      {user.role}
                    </span>
                  </div>
                </div>

                {isOrganizer && (
                  <Link
                    to="/organizer/tournaments/create"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#E6002B] text-white font-bold text-xs uppercase tracking-wider"
                  >
                    <PlusCircle className="w-4 h-4" /> Host Tournament
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-red-400 font-bold text-xs uppercase border border-red-500/20"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 rounded-lg bg-[#141824] border border-white/10 text-slate-200 text-xs font-bold uppercase"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 rounded-lg bg-[#E6002B] text-white text-xs font-bold uppercase tracking-wider"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
