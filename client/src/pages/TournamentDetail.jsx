import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  Calendar, 
  Users, 
  Trophy, 
  Shield, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  FileText, 
  Globe, 
  Lock 
} from 'lucide-react';

export default function TournamentDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isTeam } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/tournaments/slug/${slug}`);
        setTournament(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Tournament not found');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading tournament details...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Tournament Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested tournament does not exist.'}</p>
        <Link
          to="/tournaments"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Tournaments
        </Link>
      </div>
    );
  }

  const isRegistrationOpen = tournament.status === 'published' && new Date() <= new Date(tournament.registrationDeadline);
  const formattedStartDate = new Date(tournament.startDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedEndDate = new Date(tournament.endDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedDeadline = new Date(tournament.registrationDeadline).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Back Button */}
      <Link
        to="/tournaments"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Tournaments
      </Link>

      {/* HERO HEADER */}
      <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-md space-y-0">
        <div className="h-64 sm:h-80 w-full relative bg-slate-100">
          <img
            src={tournament.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'}
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-lg bg-white/95 backdrop-blur-md text-slate-900 font-extrabold text-xs uppercase tracking-wider shadow-sm border border-white">
              {tournament.game}
            </span>
            <StatusBadge status={tournament.status} type="tournament" />
          </div>

          <div className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-white/95 backdrop-blur-md text-amber-700 font-extrabold text-sm shadow-md border border-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Prize Pool: {tournament.prizePool}</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6 bg-white">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {tournament.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 font-medium">
              <Shield className="w-4 h-4 text-violet-600" />
              <span>Organized by <strong className="text-slate-900 font-bold">{tournament.organizer?.name}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-500" /> {tournament.tournamentType} ({tournament.location})
              </span>
            </div>
          </div>

          {/* Registration CTA Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 flex items-center gap-6 font-medium">
              <div>
                <span>Registration Deadline: </span>
                <strong className="text-rose-600 font-bold">{formattedDeadline}</strong>
              </div>
              <div>
                <span>Capacity: </span>
                <strong className="text-slate-900 font-bold">{tournament.registeredTeamsCount || 0} / {tournament.maxTeams} Teams</strong>
              </div>
            </div>

            {isRegistrationOpen ? (
              <button
                onClick={() => navigate(`/tournaments/${slug}/register`)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm shadow-md transition-all hover:scale-105"
              >
                Register Your Team
              </button>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-sm border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> Registration Closed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About Tournament */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" /> About Tournament
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {tournament.description}
            </p>
          </div>

          {/* Tournament Rules */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-600" /> Tournament Rules & Regulations
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-line font-mono">
              {tournament.rules}
            </div>
          </div>

          {/* Confirmed Teams Roster */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" /> Confirmed Teams ({tournament.acceptedTeams?.length || 0})
              </h3>
            </div>

            {tournament.acceptedTeams && tournament.acceptedTeams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tournament.acceptedTeams.map((team) => (
                  <div key={team._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <img
                      src={team.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${team.name}`}
                      alt={team.name}
                      className="w-10 h-10 rounded-full border border-violet-500 object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{team.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {team.country} • {team.players?.length || 0} Players
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No teams confirmed yet for this tournament lobby.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* Specification Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h4 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Tournament Specifications
            </h4>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Game Title</span>
                <span className="font-bold text-slate-900">{tournament.game}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Platform</span>
                <span className="font-bold text-slate-900">{tournament.platform}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Format Mode</span>
                <span className="font-bold text-slate-900">{tournament.tournamentType}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Lineup Team Size</span>
                <span className="font-bold text-slate-900">
                  {tournament.teamSize?.min} - {tournament.teamSize?.max} Players
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Max Teams</span>
                <span className="font-bold text-slate-900">{tournament.maxTeams} Teams</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Start Date</span>
                <span className="font-bold text-emerald-700">{formattedStartDate}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">End Date</span>
                <span className="font-bold text-slate-700">{formattedEndDate}</span>
              </div>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Organizer Details</h4>
            <div className="flex items-center gap-3">
              <img
                src={tournament.organizer?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${tournament.organizer?.username}`}
                alt={tournament.organizer?.name}
                className="w-12 h-12 rounded-full border-2 border-violet-500 object-cover"
              />
              <div>
                <h5 className="font-bold text-slate-900 text-sm">{tournament.organizer?.name}</h5>
                <p className="text-xs text-violet-700 font-semibold">@{tournament.organizer?.username}</p>
              </div>
            </div>
            {tournament.organizer?.bio && (
              <p className="text-xs text-slate-600 leading-relaxed">
                {tournament.organizer.bio}
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
