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
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Loading esports game titles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
          <Gamepad2 className="w-4 h-4" /> Game Directory
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1 font-heading">Esports Titles</h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore competitive games and active tournament lobbies.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        {games.map((game) => (
          <Link
            key={game.slug}
            to={`/games/${game.slug}`}
            className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:border-indigo-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
          >
            <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
              <img
                src={game.icon || game.banner}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2.5 py-0.5 rounded-md bg-white/95 backdrop-blur-md text-[10px] font-extrabold text-indigo-700 border border-white uppercase tracking-wider">
                  {game.category || 'Esports'}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors font-heading truncate">
                  {game.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {game.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-indigo-700">
                  {game.tournamentCount || 0} Lobbies
                </span>
                <span className="text-slate-600 group-hover:text-slate-900 flex items-center gap-1 font-heading">
                  Browse <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
