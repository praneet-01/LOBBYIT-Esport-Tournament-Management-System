import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Trophy, 
  PlusCircle, 
  FileCheck2, 
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
    { label: 'Discover Tournaments', path: '/tournaments', icon: Compass },
    { label: 'My Team & Lineup', path: '/team/my-team', icon: Users },
    { label: 'My Applications', path: '/team/registrations', icon: FileCheck2 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
      <div className="space-y-6">
        
        {/* User Card Header */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
            alt={user?.name}
            className="w-10 h-10 rounded-full border-2 border-violet-500 object-cover"
          />
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-900 truncate">{user?.name}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700">
              {mode === 'organizer' ? <Shield className="w-3 h-3 text-violet-600" /> : <Users className="w-3 h-3 text-violet-600" />}
              {user?.role} Mode
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
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
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors border border-rose-100"
      >
        <LogOut className="w-4 h-4 text-rose-500" />
        Logout
      </button>
    </aside>
  );
}
