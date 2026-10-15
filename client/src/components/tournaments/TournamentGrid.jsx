import React from 'react';
import TournamentCard from './TournamentCard';
import { Trophy } from 'lucide-react';

export default function TournamentGrid({ tournaments, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-96 rounded-2xl bg-dark-850/60 animate-pulse border border-white/5"></div>
        ))}
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="bg-[#0E121B] rounded-2xl p-12 text-center border border-white/10 shadow-lg max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
          <Trophy className="w-8 h-8 text-crimson" />
        </div>
        <h3 className="text-xl font-bold text-white font-heading">No Tournaments Found</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          No esports tournaments match your current search query or active filter settings.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament._id} tournament={tournament} />
      ))}
    </div>
  );
}
