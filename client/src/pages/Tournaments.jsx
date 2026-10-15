import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import TournamentGrid from '../components/tournaments/TournamentGrid';
import FilterPanel from '../components/tournaments/FilterPanel';
import { Trophy, Compass } from 'lucide-react';

export default function Tournaments() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [game, setGame] = useState(searchParams.get('game') || 'all');
  const [tournamentType, setTournamentType] = useState(searchParams.get('type') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (game !== 'all') queryParams.append('game', game);
        if (tournamentType !== 'all') queryParams.append('tournamentType', tournamentType);
        if (status !== 'all') queryParams.append('status', status);
        if (sort) queryParams.append('sort', sort);

        const response = await api.get(`/tournaments?${queryParams.toString()}`);
        setTournaments(response.data);
      } catch (err) {
        console.error('Error loading tournaments:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [search, game, tournamentType, status, sort]);

  const handleReset = () => {
    setSearch('');
    setGame('all');
    setTournamentType('all');
    setStatus('all');
    setSort('newest');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header with High-Contrast Crisp White Text */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider font-gaming">
            <Compass className="w-4 h-4" /> Discovery Hub
          </div>
          <h1 className="text-3xl font-black text-white mt-1 font-gaming tracking-wide">Esports Tournaments</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse live competitive tournaments, check roster requirements, and enter your team.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-lg bg-[#10141E] border border-white/10 text-xs text-slate-300 flex items-center gap-2 font-medium">
          <Trophy className="w-4 h-4 text-[#E6002B]" />
          <span>Showing <strong className="text-white font-bold">{tournaments.length}</strong> tournaments</span>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        search={search}
        setSearch={setSearch}
        game={game}
        setGame={setGame}
        tournamentType={tournamentType}
        setTournamentType={setTournamentType}
        status={status}
        setStatus={setStatus}
        sort={sort}
        setSort={setSort}
        onReset={handleReset}
      />

      {/* Tournaments Grid */}
      <TournamentGrid tournaments={tournaments} loading={loading} />

    </div>
  );
}
