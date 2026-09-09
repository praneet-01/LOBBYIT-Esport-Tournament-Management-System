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
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-violet-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col h-full">
      
      {/* Banner & Badges Header */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-xs font-bold text-violet-700 shadow-xs border border-white uppercase tracking-wider">
            {game}
          </span>
          <StatusBadge status={status} type="tournament" />
        </div>

        {/* Prize Pool Floating Badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-violet-600 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-300" />
          <span>{prizePool}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <Link to={`/tournaments/${slug}`}>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>

          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Shield className="w-3.5 h-3.5 text-violet-600" />
            <span>Hosted by <strong className="text-slate-800">{organizer?.name || 'Verified Organizer'}</strong></span>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="space-y-0.5">
            <p className="text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Starts
            </p>
            <p className="font-semibold text-slate-800">{formattedStartDate}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" /> Teams
            </p>
            <p className="font-semibold text-slate-800">
              {registeredTeamsCount || 0} / {maxTeams}
            </p>
          </div>
          <div className="space-y-0.5 pt-1.5 border-t border-slate-200/60">
            <p className="text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Type
            </p>
            <p className="font-semibold text-slate-800">{tournamentType}</p>
          </div>
          <div className="space-y-0.5 pt-1.5 border-t border-slate-200/60">
            <p className="text-slate-500 flex items-center gap-1">
              Deadline
            </p>
            <p className="font-semibold text-rose-600">{formattedDeadline}</p>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          to={`/tournaments/${slug}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-violet-600 text-slate-800 hover:text-white font-semibold text-xs transition-all duration-200 border border-slate-200 hover:border-violet-600 shadow-xs"
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
