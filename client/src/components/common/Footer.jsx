import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Trophy, Users, Heart, Gamepad2, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          
          {/* Brand & Info */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="inline-block">
              <img 
                src="/images/lobbyit-logo-transparent.png" 
                alt="LOBBYIT" 
                className="h-8 w-auto object-contain" 
              />
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The premier esports opportunity discovery platform. Connecting tournament organizers and competitive squads across top competitive titles.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Engine v1.0 Operational
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider font-gaming text-slate-200">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/tournaments" className="hover:text-cyber-cyan transition-colors flex items-center gap-1">
                  Explore Tournaments <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link to="/games" className="hover:text-cyber-cyan transition-colors flex items-center gap-1">
                  Supported Games <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <a href="/#features" className="hover:text-cyber-cyan transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#stats" className="hover:text-cyber-cyan transition-colors">
                  Platform Statistics
                </a>
              </li>
            </ul>
          </div>

          {/* User Roles */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider font-gaming text-slate-200">
              Compete & Host
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/register?role=Organizer" className="hover:text-crimson transition-colors flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-crimson" /> Host a Tournament
                </Link>
              </li>
              <li>
                <Link to="/register?role=Team" className="hover:text-cyber-cyan transition-colors flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-cyber-cyan" /> Register Your Squad
                </Link>
              </li>
              <li>
                <Link to="/register?role=Player" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" /> Join as Solo Player
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-slate-400" /> Sign In to Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Status Box */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider font-gaming text-slate-200">
              Esports Infrastructure
            </h4>
            <div className="p-4 rounded-xl bg-dark-850/80 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Match Engine</span>
                <span className="text-emerald-400 font-bold">100% ONLINE</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-1.5 rounded-full w-full"></div>
              </div>
              <p className="text-[11px] text-slate-400">
                Fair play lineup checks, auto brackets, and verified organizers.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} LOBBYIT Esports Tournament Platform. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for competitive gamers & organizers 
            <span className="w-1.5 h-1.5 rounded-full bg-crimson"></span>
            <span className="text-slate-300 font-semibold">LOBBYIT</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
