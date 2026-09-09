import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Shield, Trophy, Users, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand & Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-xs">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                LOBBY<span className="text-violet-600">IT</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              The premier esports opportunity discovery platform. Connecting tournament organizers and competitive teams across top titles.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-900 font-bold mb-4 text-base">Platform</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/tournaments" className="hover:text-violet-600 transition-colors">
                  Explore Tournaments
                </Link>
              </li>
              <li>
                <Link to="/games" className="hover:text-violet-600 transition-colors">
                  Featured Games
                </Link>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-violet-600 transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* User Roles */}
          <div>
            <h4 className="text-slate-900 font-bold mb-4 text-base">User Roles</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/register?role=Organizer" className="hover:text-violet-600 transition-colors flex items-center gap-2">
                  <Shield className="w-4 h-4 text-violet-600" /> Host a Tournament
                </Link>
              </li>
              <li>
                <Link to="/register?role=Team" className="hover:text-violet-600 transition-colors flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" /> Register Your Team
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-violet-600 transition-colors flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Competitive Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Status */}
          <div>
            <h4 className="text-slate-900 font-bold mb-4 text-base">Esports Engine</h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Operational
              </div>
              <p className="text-xs text-slate-500">
                LOBBYIT v1.0.0 — Verified Tournament Engine
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LOBBYIT Esports. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for competitive gamers & organizers <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
