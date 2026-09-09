import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import TournamentGrid from '../components/tournaments/TournamentGrid';
import { 
  Gamepad2, 
  Trophy, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';

export default function Home() {
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/tournaments?status=published');
        setFeaturedTournaments(res.data.slice(0, 6));
      } catch (err) {
        console.error('Failed to load featured tournaments:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const popularGames = [
    { name: 'Valorant', slug: 'valorant', category: 'Tactical FPS', img: 'https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg' },
    { name: 'Free Fire', slug: 'free-fire', category: 'Battle Royale', img: '/images/free_fire.png' },
    { name: 'BGMI', slug: 'bgmi', category: 'Battle Royale', img: 'https://static-cdn.jtvnw.net/ttv-boxart/513143-285x380.jpg' },
    { name: 'CS2', slug: 'cs2', category: 'Tactical FPS', img: 'https://static-cdn.jtvnw.net/ttv-boxart/32399_IGDB-285x380.jpg' },
    { name: 'Fortnite', slug: 'fortnite', category: 'Battle Royale', img: 'https://static-cdn.jtvnw.net/ttv-boxart/33214-285x380.jpg' },
    { name: 'Dota 2', slug: 'dota-2', category: 'MOBA', img: 'https://static-cdn.jtvnw.net/ttv-boxart/29595-285x380.jpg' },
    { name: 'eFootball', slug: 'efootball', category: 'Sports', img: '/images/efootball.png' },
    { name: 'Mobile Legends', slug: 'mobile-legends', category: 'Mobile MOBA', img: 'https://static-cdn.jtvnw.net/ttv-boxart/494131-285x380.jpg' },
    { name: 'League of Legends', slug: 'league-of-legends', category: 'MOBA', img: 'https://static-cdn.jtvnw.net/ttv-boxart/21779-285x380.jpg' },
    { name: 'COD', slug: 'cod', category: 'FPS', img: 'https://static-cdn.jtvnw.net/ttv-boxart/512710-285x380.jpg' }
  ];

  return (
    <div className="space-y-24 pb-20 bg-slate-50">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            The Unstop for Esports Opportunity Discovery
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 font-heading leading-tight">
            Discover. Register. <br />
            <span className="text-indigo-600 font-brand">Compete.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Find esports tournaments, build your team, and compete in events hosted by organizers across the gaming community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/tournaments"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-md transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 font-heading"
            >
              <Compass className="w-5 h-5" /> Explore Tournaments
            </Link>
            <Link
              to="/register?role=Organizer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-base border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2 font-heading"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-600" /> Host a Tournament
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <p className="text-2xl font-extrabold text-slate-900 font-heading">100%</p>
              <p className="text-xs text-slate-500 font-medium">Free Tournament Hosting</p>
            </div>
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <p className="text-2xl font-extrabold text-indigo-700 font-heading">Instant</p>
              <p className="text-xs text-slate-500 font-medium">Lineup Validation Checks</p>
            </div>
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <p className="text-2xl font-extrabold text-sky-600 font-heading">Direct</p>
              <p className="text-xs text-slate-500 font-medium">Organizer Review</p>
            </div>
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <p className="text-2xl font-extrabold text-amber-600 font-heading">Seamless</p>
              <p className="text-xs text-slate-500 font-medium">Team Applications</p>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURED TOURNAMENTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-4 h-4" /> Active Competitions
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-heading">Featured Tournaments</h2>
          </div>
          <Link
            to="/tournaments"
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors font-heading"
          >
            View All Tournaments <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <TournamentGrid tournaments={featuredTournaments} loading={loading} />
      </section>

      {/* OFFICIAL GAME POSTERS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Game Directory</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">Official Game Lobbies</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Browse competitive titles including Free Fire, Valorant, eFootball, Mobile Legends, Dota 2, CS2 & Fortnite.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
          {popularGames.map((game) => (
            <Link
              key={game.slug}
              to={`/games/${game.slug}`}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:border-indigo-500 transition-all duration-300 hover:scale-[1.03]"
            >
              <img
                src={game.img}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-0.5">
                  {game.category}
                </span>
                <h4 className="text-base font-extrabold text-white group-hover:text-indigo-200 transition-colors font-heading truncate">
                  {game.name}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Simple Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">How LOBBYIT Works</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Streamlined tournament discovery and team registration without unnecessary complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Organizer Flow */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-heading">For Organizers</h3>
                <p className="text-xs text-slate-500">Publish events & manage team registrations</p>
              </div>
            </div>

            <ol className="space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-heading">1</span>
                <div>
                  <strong className="text-slate-900">Create Tournament:</strong> Fill basic details, lineup rules, start dates, and prize pool.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-heading">2</span>
                <div>
                  <strong className="text-slate-900">Publish Event:</strong> Make your tournament visible on the public discovery portal.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-heading">3</span>
                <div>
                  <strong className="text-slate-900">Manage Teams:</strong> Review submitted team player rosters and click Accept or Reject.
                </div>
              </li>
            </ol>
          </div>

          {/* Team Flow */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-heading">For Competitive Teams</h3>
                <p className="text-xs text-slate-500">Build squad & enter lobbies</p>
              </div>
            </div>

            <ol className="space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-heading">1</span>
                <div>
                  <strong className="text-slate-900">Discover Tournaments:</strong> Filter by game, status, location, or start dates.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-heading">2</span>
                <div>
                  <strong className="text-slate-900">Create Team Profile:</strong> Add your roster with in-game names & player details.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-heading">3</span>
                <div>
                  <strong className="text-slate-900">Register & Track:</strong> Submit team lineup and track approval status in real-time.
                </div>
              </li>
            </ol>
          </div>

        </div>
      </section>

      {/* WHY LOBBYIT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Features</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">Why Use LOBBYIT?</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base font-heading">Discover Tournaments</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Find live open esports tournaments across platforms and games with real-time status badges.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base font-heading">Easy Registration</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              1-click team registration with automatic line-up player count validation against tournament rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base font-heading">Team Roster Management</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Manage player in-game names, captain assignments, and countries in your team profile.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base font-heading">Organizer Dashboard</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clean dashboard to manage drafts, published tournaments, and review registered teams.
            </p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center mx-auto shadow-md">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading">
            Ready to enter the lobby?
          </h2>
          <p className="text-indigo-100 max-w-xl mx-auto text-sm sm:text-base">
            Join competitive players and organizers on LOBBYIT today. Create an account in under 60 seconds.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-900 font-extrabold text-sm shadow-md transition-all hover:scale-105 font-heading"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
