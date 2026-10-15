import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Gamepad2, ArrowRight } from 'lucide-react';

export default function Games() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await api.get('/games');
        setGames(response.data);
      } catch (err) {
        console.error('Error fetching games:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#E6002B] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-slate-400 text-xs">Loading esports game titles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-black text-slate-100 min-h-[80vh]">
      
      {/* Header with High-Contrast Crisp White Text */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider font-gaming">
          <Gamepad2 className="w-4 h-4" /> Game Directory
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1 font-gaming tracking-wide">
          Esports Titles
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore competitive games and active tournament lobbies.
        </p>
      </div>

      {/* Game Cards - Clean Dark Theme (NO white boxes) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {games.map((game) => (
          <Link
            key={game.slug}
            to={`/games/${game.slug}`}
            className="group bg-[#10141E] rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between"
          >
            <div className="relative h-56 w-full bg-[#06070B] overflow-hidden">
              <img
                src={game.icon || game.banner}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 opacity-85 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10141E] via-transparent to-transparent"></div>
              
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-cyan-400 border border-white/10 uppercase tracking-wider font-gaming">
                  {game.category || 'Esports'}
                </span>
              </div>
            </div>

            <div className="p-3.5 space-y-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white font-gaming truncate">
                  {game.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {game.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                <span className="text-cyan-400 font-gaming">
                  {game.tournamentCount || 0} Lobbies
                </span>
                <span className="text-slate-400 group-hover:text-white flex items-center gap-1 font-gaming transition-colors">
                  Browse <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
