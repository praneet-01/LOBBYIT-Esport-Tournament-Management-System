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
      } final: {
        setLoading(false);
      }
    };

    fetchGameDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Loading game tournaments...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Game Not Found</h2>
        <Link to="/games" className="inline-flex items-center gap-2 text-violet-700 text-sm font-semibold">
          <ChevronLeft className="w-4 h-4" /> Back to Games Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <Link
        to="/games"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Games Directory
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
          <Gamepad2 className="w-12 h-12 text-violet-600" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-violet-700 uppercase tracking-widest">{game.category || 'Esports Title'}</span>
          <h1 className="text-3xl font-extrabold text-slate-900">{game.name} Tournaments</h1>
          <p className="text-sm text-slate-600 max-w-2xl">{game.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Active & Upcoming Competitions</h2>
        <TournamentGrid tournaments={game.tournaments || []} loading={false} />
      </div>

    </div>
  );
}
