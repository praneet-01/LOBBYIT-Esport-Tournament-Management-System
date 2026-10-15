import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import TournamentGrid from "../components/tournaments/TournamentGrid";
import {
  Trophy,
  Users,
  ShieldCheck,
  ArrowRight,
  Crosshair,
  Flame,
  Zap,
  ChevronRight,
  Play
} from "lucide-react";

export default function Home() {
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get("/tournaments?status=published");
        setFeaturedTournaments(res.data.slice(0, 6));
      } catch (err) {
        console.error("Failed to load featured tournaments:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const popularGames = [
    {
      name: "Valorant",
      slug: "valorant",
      category: "Tactical FPS",
      img: "https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg",
    },
    {
      name: "Free Fire",
      slug: "free-fire",
      category: "Battle Royale",
      img: "/images/free_fire.png",
    },
    {
      name: "BGMI",
      slug: "bgmi",
      category: "Battle Royale",
      img: "https://static-cdn.jtvnw.net/ttv-boxart/513143-285x380.jpg",
    },
    {
      name: "CS2",
      slug: "cs2",
      category: "Tactical FPS",
      img: "https://static-cdn.jtvnw.net/ttv-boxart/32399_IGDB-285x380.jpg",
    },
    {
      name: "Fortnite",
      slug: "fortnite",
      category: "Battle Royale",
      img: "https://static-cdn.jtvnw.net/ttv-boxart/33214-285x380.jpg",
    },
    {
      name: "Dota 2",
      slug: "dota-2",
      category: "MOBA",
      img: "https://static-cdn.jtvnw.net/ttv-boxart/29595-285x380.jpg",
    },
    {
      name: "eFootball",
      slug: "efootball",
      category: "Sports",
      img: "/images/efootball.png",
    },
    {
      name: "Mobile Legends",
      slug: "mobile-legends",
      category: "Mobile MOBA",
      img: "https://static-cdn.jtvnw.net/ttv-boxart/494131-285x380.jpg",
    },
  ];

  const features = [
    {
      icon: <Crosshair className="w-6 h-6 text-cyan-400" />,
      tag: "STEP 01",
      title: "DROP IN",
      description: "Discover verified open qualifiers and invitationals across competitive titles with transparent schedules.",
    },
    {
      icon: <Users className="w-6 h-6 text-[#E6002B]" />,
      tag: "STEP 02",
      title: "SQUAD UP",
      description: "Build your team roster, verify in-game UID credentials, manage substitutes, and coordinate strategies.",
    },
    {
      icon: <Trophy className="w-6 h-6 text-amber-400" />,
      tag: "STEP 03",
      title: "COMPETE",
      description: "Automated bracket generation, real-time match check-in, room credentials, and verified score reporting.",
    },
    {
      icon: <Flame className="w-6 h-6 text-rose-500" />,
      tag: "STEP 04",
      title: "CLAIM GLORY",
      description: "Record match results, earn leaderboard ranking points, and showcase tournament trophies.",
    }
  ];

  return (
    <div className="space-y-24 pb-20 bg-black text-slate-100 overflow-x-hidden">
      
      {/* ========================================================
          CYBERPUNK HERO SECTION (EXACT REFERENCE LAYOUT)
         ======================================================== */}
      <section className="relative min-h-[92vh] sm:min-h-[96vh] lg:min-h-[98vh] flex flex-col justify-end overflow-hidden border-b border-white/10 bg-black">
        
        {/* GIANT BACKGROUND TEXT "BATTLE" (With 'T' half-visible on both sides of character) */}
        <div className="absolute inset-x-0 top-[12%] sm:top-[14%] md:top-[16%] flex items-center justify-between px-2 sm:px-6 md:px-10 max-w-full select-none pointer-events-none z-0">
          {/* Left: BAT with T half-visible peeking behind left side of head/hair */}
          <span className="text-[18vw] sm:text-[19vw] md:text-[20vw] font-black tracking-[0.02em] sm:tracking-[0.04em] text-white font-gaming uppercase whitespace-nowrap leading-none drop-shadow-[0_4px_35px_rgba(255,255,255,0.25)] translate-x-[5vw] sm:translate-x-[7vw] md:translate-x-[8vw]">
            BAT
          </span>

          {/* Right: TLE with T half-visible peeking behind right side of head/hair */}
          <span className="text-[18vw] sm:text-[19vw] md:text-[20vw] font-black tracking-[0.02em] sm:tracking-[0.04em] text-white font-gaming uppercase whitespace-nowrap leading-none drop-shadow-[0_4px_35px_rgba(255,255,255,0.25)] -translate-x-[5vw] sm:-translate-x-[7vw] md:-translate-x-[8vw]">
            TLE
          </span>
        </div>

        {/* CENTER CHARACTER (Full Height Transparent Cutout, Not Hidden, True to Reference) */}
        <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-center pointer-events-none z-10">
          <img
            src="/images/hero-character-cutout.png"
            alt="Cyber Gaming Character"
            className="h-[90vh] sm:h-[94vh] max-h-[880px] w-auto object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]"
          />
          {/* Subtle bottom fade into pure black */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"></div>
        </div>

        {/* EDITORIAL CONTENT: LEFT & RIGHT (Symmetrically positioned within the side zones) */}
        <div className="w-full mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 relative z-20 pointer-events-none pt-[46vh] sm:pt-[50vh] md:pt-[52vh] pb-14 sm:pb-20">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            
            {/* Left Box (Reference: "ESPORTS ARENA") */}
            <div className="w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[320px] space-y-3 pointer-events-auto text-left">
              <h3 className="text-sm font-bold text-[#FF2E51] font-gaming uppercase tracking-widest">
                ESPORTS ARENA
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter the next dimension of competitive gaming. Squad up, compete in elite tournament brackets, and rise to championship victory.
              </p>
              <div className="pt-1">
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/20 hover:border-[#FF2E51] bg-[#10141E]/90 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider font-gaming transition-colors group"
                >
                  <span>EXPLORE NOW</span>
                  <span className="text-[#FF2E51] font-mono tracking-tighter group-hover:translate-x-0.5 transition-transform">///</span>
                </Link>
              </div>
            </div>

            {/* Right Box (Reference: "THE FUTURE") - Left Aligned */}
            <div className="w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[320px] space-y-3 pointer-events-auto text-left">
              <h3 className="text-sm font-bold text-[#FF2E51] font-gaming uppercase tracking-widest">
                THE FUTURE
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated match lobbies, live bracket progression, anti-cheat roster verification, and instant verified prize payouts.
              </p>
              <div className="pt-1 flex justify-start">
                <Link
                  to="/register?role=Organizer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/20 hover:border-white/40 bg-[#10141E]/90 backdrop-blur-md text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider font-gaming transition-colors"
                >
                  <Play className="w-3 h-3 text-[#FF2E51] fill-[#FF2E51]" />
                  <span>HOST TOURNAMENT</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================
          FEATURED TOURNAMENTS SECTION (STARTS DIRECTLY FROM HERE)
         ======================================================== */}
      <section id="tournaments" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E6002B] font-gaming">
              <span className="w-2 h-2 rounded-full bg-[#E6002B]" />
              Live Competitions
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-gaming">
              FEATURED TOURNAMENTS
            </h2>
            <p className="text-xs text-slate-400">
              Join active battle royales, tactical shootouts, and competitive matches.
            </p>
          </div>

          <Link
            to="/tournaments"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-white transition-colors"
          >
            View All Tournaments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <TournamentGrid tournaments={featuredTournaments} loading={loading} />
      </section>

      {/* ========================================================
          4-PILLAR FEATURES GRID (HOW LOBBYIT WORKS)
         ======================================================== */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-gaming">
            BUILT FOR PLAYERS & ORGANIZERS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-gaming tracking-tight">
            HOW LOBBYIT WORKS
          </h2>
          <p className="text-xs text-slate-400">
            From squad registration to final championship matches in one unified system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-[#10141E] border border-white/10 hover:border-white/20 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-gaming tracking-wider">
                    {item.tag}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white font-gaming tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition-colors">
                <span>Learn more</span>
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          POPULAR GAMES DIRECTORY
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-gaming">
              Top Arenas
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-gaming">
              CHOOSE YOUR GAME
            </h2>
            <p className="text-xs text-slate-400">
              Select your competitive title to see dedicated brackets and events.
            </p>
          </div>

          <Link
            to="/games"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E6002B] hover:text-white transition-colors"
          >
            All 10+ Titles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {popularGames.map((game, idx) => (
            <Link
              key={idx}
              to={`/games/${game.slug}`}
              className="group relative rounded-xl overflow-hidden bg-[#10141E] border border-white/10 hover:border-white/25 transition-all aspect-[3/4] flex flex-col justify-end p-4"
            >
              <img
                src={game.img}
                alt={game.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06070B] via-[#06070B]/50 to-transparent" />

              <div className="relative z-10 space-y-1">
                <span className="inline-block px-2 py-0.5 rounded bg-black/70 text-[9px] font-bold text-cyan-400 uppercase tracking-wider font-gaming border border-white/10">
                  {game.category}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white font-gaming tracking-wide">
                  {game.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================
          HOST CTA BANNER
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl p-8 sm:p-12 bg-[#10141E] border border-white/10">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider font-gaming">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> For Tournament Organizers
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-white font-gaming tracking-tight leading-tight">
              HOST YOUR ESPORTS TOURNAMENT WITH ZERO HASSLE.
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Create single elimination, round robin, or battle royale lobbies in minutes. 
              Manage team rosters, check-in rooms, seed brackets, and publish results automatically.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <Link
                to="/register?role=Organizer"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase tracking-wider transition-colors font-gaming text-center"
              >
                Create Organizer Account
              </Link>
              <Link
                to="/tournaments"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-200 font-bold text-xs uppercase tracking-wider border border-white/15 transition-colors font-gaming text-center"
              >
                Explore Active Events
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
