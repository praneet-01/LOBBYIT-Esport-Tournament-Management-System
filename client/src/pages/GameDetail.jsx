import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import TournamentGrid from '../components/tournaments/TournamentGrid';
import { Gamepad2, ChevronLeft } from 'lucide-react';

export default function GameDetail() {
  const { slug } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameDetail = async () => {
      try {
        const res = await api.get(`/games/${slug}`);
        setGame(res.data);
      } catch (err) {
        console.error('Failed to load game detail:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#E6002B] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-slate-400 text-xs">Loading game tournaments...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white font-gaming">Game Not Found</h2>
        <Link to="/games" className="inline-flex items-center gap-2 text-cyan-400 text-xs font-semibold">
          <ChevronLeft className="w-4 h-4" /> Back to Games Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-black text-slate-100">
      
      <Link
        to="/games"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Games Directory
      </Link>

      <div className="bg-[#10141E] rounded-xl p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-xl bg-[#141824] border border-white/15 flex items-center justify-center shrink-0">
          <Gamepad2 className="w-10 h-10 text-cyan-400" />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-gaming">
            {game.category || 'Competitive Arena'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide">
            {game.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            {game.description || `Browse and register for active ${game.name} competitive tournaments and scrims.`}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white font-gaming tracking-wide">
          Active {game.name} Tournaments
        </h2>
        <TournamentGrid tournaments={game.tournaments || []} loading={false} />
      </div>

    </div>
  );
}
