import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Trophy, 
  PlusCircle, 
  FileCheck2, 
  Gamepad2,
  Users, 
  Compass, 
  User, 
  LogOut, 
  Shield 
} from 'lucide-react';

export default function Sidebar({ mode = 'organizer' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = mode === 'organizer' ? [
    { label: 'Overview', path: '/organizer/dashboard', icon: LayoutDashboard },
    { label: 'Host Tournament', path: '/organizer/tournaments/create', icon: PlusCircle },
    { label: 'My Tournaments', path: '/organizer/tournaments', icon: Trophy },
    { label: 'Registrations', path: '/organizer/registrations', icon: FileCheck2 },
    { label: 'Profile', path: '/profile', icon: User },
  ] : [
    { label: 'Overview', path: '/team/dashboard', icon: LayoutDashboard },
    { label: 'My Matches', path: '/my-matches', icon: Gamepad2 },
    { label: 'Discover Tournaments', path: '/tournaments', icon: Compass },
    { label: 'My Team & Lineup', path: '/team/my-team', icon: Users },
    { label: 'My Applications', path: '/team/registrations', icon: FileCheck2 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-full lg:w-64 bg-[#10141E] rounded-2xl p-4 border border-white/10 flex flex-col justify-between space-y-6">
      <div className="space-y-6">
        
        {/* User Card Header */}
        <div className="p-3.5 rounded-xl bg-[#0B0E17] border border-white/10 flex items-center gap-3">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
            alt={user?.name}
            className="w-10 h-10 rounded-full border border-white/20 object-cover"
          />
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-white truncate font-gaming">{user?.name}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
              {mode === 'organizer' ? <Shield className="w-3 h-3 text-[#E6002B]" /> : <Users className="w-3 h-3 text-cyan-400" />}
              {user?.role} Portal
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-gaming font-bold tracking-wider uppercase transition-all ${
                  active
                    ? 'bg-[#E6002B] text-white'
                    : 'text-slate-400 hover:bg-[#151926] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-gaming font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-red-500/20 cursor-pointer"
      >
        <LogOut className="w-4 h-4 text-red-400" />
        Logout
      </button>
    </aside>
  );
}
