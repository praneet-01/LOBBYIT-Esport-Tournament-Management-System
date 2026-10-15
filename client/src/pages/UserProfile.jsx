import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Mail, AtSign, User } from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-slate-400">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-black text-slate-100 min-h-[80vh]">
      
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide">User Account Profile</h1>
        <p className="text-xs text-slate-400 mt-0.5">Account details and active competitive role.</p>
      </div>

      <div className="bg-[#10141E] rounded-xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
            alt={user.name}
            className="w-20 h-20 rounded-full border border-white/20 object-cover"
          />
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-2xl font-black text-white font-gaming">{user.name}</h2>
            <p className="text-xs text-cyan-400 font-semibold">@{user.username}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs font-bold uppercase font-gaming">
              {user.role === 'Organizer' ? <Shield className="w-3.5 h-3.5 text-[#E6002B]" /> : <User className="w-3.5 h-3.5 text-cyan-400" />}
              {user.role} Account
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
          <div className="p-4 rounded-lg bg-[#0B0E17] border border-white/10 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-cyan-400" /> Registered Email
            </span>
            <p className="text-sm font-bold text-white">{user.email}</p>
          </div>
          <div className="p-4 rounded-lg bg-[#0B0E17] border border-white/10 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <AtSign className="w-4 h-4 text-[#E6002B]" /> Username Handle
            </span>
            <p className="text-sm font-bold text-white">@{user.username}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
