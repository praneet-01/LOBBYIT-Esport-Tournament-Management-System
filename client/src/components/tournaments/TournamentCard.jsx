import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { Calendar, Users, Trophy, Shield, MapPin, ArrowRight } from 'lucide-react';

export default function TournamentCard({ tournament }) {
  const {
    title,
    slug,
    game,
    banner,
    organizer,
    tournamentType,
    startDate,
    registrationDeadline,
    maxTeams,
    registeredTeamsCount,
    prizePool,
    status
  } = tournament;

  const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const formattedDeadline = new Date(registrationDeadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="group esports-card rounded-xl overflow-hidden flex flex-col h-full hover:border-[#E6002B] transition-all">
      
      {/* Banner & Badges Header */}
      <div className="relative h-48 w-full overflow-hidden bg-dark-900">
        <img
          src={banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E15] via-dark-900/30 to-transparent"></div>
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-extrabold text-cyber-cyan border border-cyber-cyan/30 uppercase tracking-wider font-gaming">
            {game}
          </span>
          <StatusBadge status={status} type="tournament" />
        </div>

        {/* Prize Pool Floating Badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg flex items-center gap-1.5 font-gaming">
          <Trophy className="w-3.5 h-3.5 text-slate-950" />
          <span>{prizePool}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-gradient-to-b from-[#0E121B] to-[#0A0C13]">
        <div>
          <Link to={`/tournaments/${slug}`}>
            <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyber-cyan transition-colors line-clamp-1 font-heading">
              {title}
            </h3>
          </Link>

          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-400 font-medium">
            <Shield className="w-3.5 h-3.5 text-crimson" />
            <span>Hosted by <strong className="text-slate-200">{organizer?.name || 'Verified Host'}</strong></span>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm bg-dark-850/80 p-3 rounded-xl border border-white/5">
          <div className="space-y-0.5">
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Starts
            </p>
            <p className="font-bold text-slate-200 text-sm">{formattedStartDate}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" /> Teams
            </p>
            <p className="font-bold text-cyber-cyan text-sm">
              {registeredTeamsCount || 0} / {maxTeams}
            </p>
          </div>
          <div className="space-y-0.5 pt-1.5 border-t border-white/5">
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Format
            </p>
            <p className="font-bold text-slate-300 text-sm">{tournamentType}</p>
          </div>
          <div className="space-y-0.5 pt-1.5 border-t border-white/5">
            <p className="text-slate-400 text-xs">
              Deadline
            </p>
            <p className="font-bold text-crimson text-sm">{formattedDeadline}</p>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          to={`/tournaments/${slug}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-[#E6002B] text-slate-200 hover:text-white font-bold text-sm uppercase tracking-wider transition-colors border border-white/10 hover:border-[#E6002B] font-gaming"
        >
          View Tournament <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
