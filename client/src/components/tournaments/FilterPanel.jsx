import React from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';

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
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
      
      {/* Search Input Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tournaments by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-600 text-sm transition-colors"
          />
        </div>

        {/* Sort Select */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium text-sm focus:outline-none focus:border-violet-600"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="upcoming">Sort: Upcoming Start</option>
            <option value="deadline">Sort: Closing Soon</option>
          </select>
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
        
        {/* Game Filter */}
        <div>
          <label className="block text-slate-500 font-semibold mb-1.5 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-violet-600" /> Game Title
          </label>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-violet-600"
          >
            <option value="all">All Games</option>
            {gamesList.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Online / Offline Filter */}
        <div>
          <label className="block text-slate-500 font-semibold mb-1.5">Mode</label>
          <select
            value={tournamentType}
            onChange={(e) => setTournamentType(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-violet-600"
          >
            <option value="all">All Modes</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-slate-500 font-semibold mb-1.5">Registration Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-violet-600"
          >
            <option value="all">All Statuses</option>
            <option value="published">Registration Open</option>
            <option value="registration_closed">Closed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Reset Filter Button */}
      {(search || game !== 'all' || tournamentType !== 'all' || status !== 'all' || sort !== 'newest') && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
