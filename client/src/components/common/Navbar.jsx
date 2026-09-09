import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Gamepad2, Shield, Users, LogOut, Menu, X, PlusCircle, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm group-hover:bg-violet-700 transition-all duration-300">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
                LOBBY<span className="text-violet-600">IT</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-500 font-bold uppercase -mt-1">
                Esports Hub
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              to="/"
              className={`transition-colors ${isActive('/') ? 'text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Home
            </Link>
            <Link
              to="/tournaments"
              className={`transition-colors ${isActive('/tournaments') ? 'text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Explore Tournaments
            </Link>
            <Link
              to="/games"
              className={`transition-colors ${isActive('/games') ? 'text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Games
            </Link>
            <a
              href="/#how-it-works"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              How It Works
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {isOrganizer ? (
                  <>
                    <Link
                      to="/organizer/tournaments/create"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-sm transition-all"
                    >
                      <PlusCircle className="w-4 h-4" /> Host Tournament
                    </Link>
                    <Link
                      to="/organizer/dashboard"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors border border-slate-200"
                    >
                      <Shield className="w-4 h-4 text-violet-600" /> Dashboard
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/team/dashboard"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    <Users className="w-4 h-4" /> Team Dashboard
                  </Link>
                )}

                <div className="relative group">
                  <div className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer hover:border-violet-400 transition-colors">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-violet-500"
                    />
                    <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-52 py-2 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.username}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-violet-100 text-violet-700 uppercase">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    >
                      <User className="w-4 h-4 text-slate-400" /> Account Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-sm transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 py-4 px-6 space-y-4 shadow-lg">
          <nav className="flex flex-col gap-2 font-medium text-sm">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={`py-2 px-3 rounded-lg ${isActive('/') ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-700'}`}
            >
              Home
            </Link>
            <Link
              to="/tournaments"
              onClick={() => setMobileOpen(false)}
              className={`py-2 px-3 rounded-lg ${isActive('/tournaments') ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-700'}`}
            >
              Explore Tournaments
            </Link>
            <Link
              to="/games"
              onClick={() => setMobileOpen(false)}
              className={`py-2 px-3 rounded-lg ${isActive('/games') ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-700'}`}
            >
              Games
            </Link>
          </nav>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
            {user ? (
              <>
                {isOrganizer && (
                  <Link
                    to="/organizer/tournaments/create"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" /> Host Tournament
                  </Link>
                )}
                <Link
                  to={isOrganizer ? '/organizer/dashboard' : '/team/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-semibold text-sm border border-rose-200"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold shadow-sm"
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
