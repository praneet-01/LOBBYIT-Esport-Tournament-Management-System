import React from 'react';
import TournamentCard from './TournamentCard';
import { Trophy } from 'lucide-react';

export default function TournamentGrid({ tournaments, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-96 rounded-2xl bg-slate-200/60 animate-pulse border border-slate-200"></div>
        ))}
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
          <Trophy className="w-8 h-8 text-violet-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Tournaments Found</h3>
        <p className="text-sm text-slate-500">
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
