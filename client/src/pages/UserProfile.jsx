import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Mail, AtSign } from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-slate-500">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">User Account Profile</h1>
        <p className="text-xs text-slate-500">Account details and active competitive role.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
            alt={user.name}
            className="w-24 h-24 rounded-full border-4 border-violet-500 object-cover shadow-sm"
          />
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-violet-700 font-bold">@{user.username}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs font-bold uppercase">
              {user.role === 'Organizer' ? <Shield className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              {user.role} Account
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-violet-600" /> Registered Email
            </span>
            <p className="text-sm font-bold text-slate-900">{user.email}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <AtSign className="w-4 h-4 text-sky-600" /> Username Handle
            </span>
            <p className="text-sm font-bold text-slate-900">@{user.username}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
