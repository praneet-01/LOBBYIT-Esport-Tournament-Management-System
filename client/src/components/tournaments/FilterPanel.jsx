import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function FilterPanel({
  search,
  setSearch,
  game,
  setGame,
  tournamentType,
  setTournamentType,
  status,
  setStatus,
  sort,
  setSort,
  onReset
}) {
  const gamesList = [
    'Valorant',
    'BGMI',
    'Free Fire',
    'CS2',
    'Fortnite',
    'COD',
    'League of Legends',
    'Dota 2'
  ];

  return (
    <div className="bg-[#10141E] rounded-xl p-4 sm:p-5 border border-white/10 space-y-4">
      
      {/* Search Input Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tournaments by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#E6002B] text-xs transition-colors"
          />
        </div>

        {/* Sort Select */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 rounded-lg bg-[#0B0E17] border border-white/15 text-slate-200 font-medium text-xs focus:outline-none focus:border-[#E6002B]"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="upcoming">Sort: Upcoming Start</option>
            <option value="deadline">Sort: Closing Soon</option>
          </select>
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
        <div>
          <label className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider font-gaming">
            Filter by Game
          </label>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg bg-[#0B0E17] border border-white/15 text-slate-200 focus:outline-none focus:border-[#E6002B] text-xs"
          >
            <option value="all">All Games</option>
            {gamesList.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider font-gaming">
            Format
          </label>
          <select
            value={tournamentType}
            onChange={(e) => setTournamentType(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg bg-[#0B0E17] border border-white/15 text-slate-200 focus:outline-none focus:border-[#E6002B] text-xs"
          >
            <option value="all">All Formats</option>
            <option value="Single Elimination">Single Elimination</option>
            <option value="Double Elimination">Double Elimination</option>
            <option value="Round Robin">Round Robin</option>
            <option value="Battle Royale">Battle Royale</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider font-gaming">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg bg-[#0B0E17] border border-white/15 text-slate-200 focus:outline-none focus:border-[#E6002B] text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="published">Registration Open</option>
            <option value="registration_closed">Closed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-white/5">
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      </div>

    </div>
  );
}
