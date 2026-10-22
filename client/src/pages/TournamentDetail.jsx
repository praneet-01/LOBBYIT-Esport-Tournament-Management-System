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
  ChevronLeft, 
  FileText, 
  Globe, 
  Lock,
  Gamepad2,
  Hash,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Radio,
  Clock,
  RefreshCw,
  Edit3
} from 'lucide-react';
import MatchRoomManagerModal from '../components/organizer/MatchRoomManagerModal';

export default function TournamentDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await api.get(`/tournaments/slug/${slug}`);
      setTournament(response.data);
    } catch (err) {
      if (!tournament) setError(err.response?.data?.message || 'Tournament not found');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // 6-second polling for real-time match room sync
    const interval = setInterval(() => {
      fetchDetail(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [slug]);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const togglePasswordVisibility = (matchId) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#E6002B] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-slate-400 text-xs">Loading tournament details...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-white font-gaming">Tournament Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'The requested tournament does not exist.'}</p>
        <Link
          to="/tournaments"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E6002B] text-white font-bold text-xs uppercase tracking-wider font-gaming"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-black text-slate-100">
      
      {/* Back Button */}
      <Link
        to="/tournaments"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Tournaments
      </Link>

      {/* HERO HEADER */}
      <div className="rounded-2xl overflow-hidden bg-[#10141E] border border-white/10 space-y-0">
        <div className="h-64 sm:h-80 w-full relative bg-[#06070B]">
          <img
            src={tournament.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'}
            alt={tournament.title}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10141E] via-transparent to-transparent"></div>
          
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-cyan-400 font-extrabold text-xs uppercase tracking-wider border border-white/10 font-gaming">
              {tournament.game}
            </span>
            <StatusBadge status={tournament.status} type="tournament" />
          </div>

          <div className="absolute bottom-4 right-4 px-3.5 py-1.5 rounded-lg bg-[#E6002B] text-white font-black text-xs flex items-center gap-1.5 font-gaming">
            <Trophy className="w-3.5 h-3.5" />
            <span>Prize Pool: {tournament.prizePool}</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-gaming">
              {tournament.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
              <Shield className="w-3.5 h-3.5 text-[#E6002B]" />
              <span>Organized by <strong className="text-slate-200 font-bold">{tournament.organizer?.name}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {tournament.tournamentType} ({tournament.location})
              </span>
            </div>
          </div>

          {/* Registration CTA Bar */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-6 font-medium">
              <div>
                <span>Deadline: </span>
                <strong className="text-[#E6002B] font-bold">{formattedDeadline}</strong>
              </div>
              <div>
                <span>Capacity: </span>
                <strong className="text-slate-200 font-bold">{tournament.registeredTeamsCount || 0} / {tournament.maxTeams} Teams</strong>
              </div>
            </div>

            {isRegistrationOpen ? (
              <button
                onClick={() => navigate(`/tournaments/${slug}/register`)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase tracking-wider transition-colors font-gaming cursor-pointer"
              >
                Register Your Team
              </button>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white/5 text-slate-500 font-bold text-xs uppercase border border-white/10 cursor-not-allowed flex items-center justify-center gap-1.5 font-gaming"
              >
                <Lock className="w-3.5 h-3.5" /> Registration Closed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About Tournament */}
          <div className="bg-[#10141E] rounded-xl p-6 border border-white/10 space-y-3">
            <h3 className="text-lg font-black text-white font-gaming flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> About Tournament
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {tournament.description}
            </p>
          </div>

          {/* Match Rounds, Maps & Custom Room Credentials */}
          <div className="bg-[#10141E] rounded-xl p-6 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-[#E6002B]" />
                <div>
                  <h3 className="text-lg font-black text-white font-gaming uppercase tracking-wide">
                    Match Rounds & Map Rotation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live room credentials automatically sync within 10 seconds.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user && (user.role === 'Organizer' || user.role === 'Admin') && (tournament.organizer?._id === user._id || tournament.organizer === user._id) && (
                  <button
                    onClick={() => setShowRoomModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs font-gaming uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Manage Room IDs & Maps
                  </button>
                )}
                <button
                  onClick={() => fetchDetail(true)}
                  disabled={refreshing}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
                  title="Check for room credential updates"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Matches list */}
            {tournament.matches && tournament.matches.length > 0 ? (
              <div className="space-y-3">
                {tournament.matches.map((match, idx) => {
                  const isLive = match.status === 'live' || Boolean(match.roomId && match.status !== 'completed');
                  const isPasswordVisible = showPasswordMap[match._id];

                  return (
                    <div
                      key={match._id || idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isLive 
                          ? 'bg-gradient-to-r from-emerald-950/20 via-[#141926] to-[#10141E] border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                          : 'bg-[#0B0E17] border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-mono font-bold text-white text-xs">
                            #{match.matchNumber || idx + 1}
                          </span>
                          <span className="font-bold text-white text-xs font-gaming">
                            {match.title || `Match ${match.matchNumber || idx + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 font-gaming">
                            🗺️ {match.map}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isLive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                              : 'bg-white/10 text-slate-300'
                          }`}>
                            {match.status || 'upcoming'}
                          </span>
                        </div>
                      </div>

                      {/* Credentials Block */}
                      <div className="mt-3">
                        {tournament.isRoomUnlocked ? (
                          match.roomId ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-black/60 border border-white/10 text-xs">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                                    <Hash className="w-3 h-3 text-cyan-400" /> Room ID
                                  </span>
                                  <span className="font-mono font-bold text-white text-sm">
                                    {match.roomId}
                                  </span>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(match.roomId, `room-${match._id}`)}
                                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedKey === `room-${match._id}` ? <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                                    <Key className="w-3 h-3 text-emerald-400" /> Password
                                  </span>
                                  <span className="font-mono font-bold text-emerald-400 text-sm">
                                    {isPasswordVisible ? match.password || 'None' : '••••••••'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => togglePasswordVisibility(match._id)}
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                                  >
                                    {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(match.password, `pass-${match._id}`)}
                                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === `pass-${match._id}` ? <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-[#0B0E17] border border-white/5 text-center text-xs text-slate-400">
                              <span>⏳ Room ID & Password will be released 10-15 mins before match start.</span>
                            </div>
                          )
                        ) : tournament.userRegistrationStatus === 'pending' ? (
                          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <span className="flex items-center gap-2 text-amber-300 font-semibold">
                              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                              Application Pending Organizer Approval: Room ID & Password will unlock automatically once your squad entry is accepted.
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 self-start sm:self-auto font-gaming">
                              Pending Review
                            </span>
                          </div>
                        ) : tournament.userRegistrationStatus === 'rejected' ? (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                            Registration Declined: You do not have access to room credentials for this tournament.
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-[#0B0E17] border border-white/5 flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Custom Room ID & Password are locked for registered squads only.
                            </span>
                            {isRegistrationOpen && (
                              <button
                                onClick={() => navigate(`/tournaments/${slug}/register`)}
                                className="text-cyan-400 hover:underline font-bold text-[11px]"
                              >
                                Register Now ➔
                              </button>
                            )}
                          </div>
                        )}

                        {match.customNote && (
                          <p className="text-[11px] text-cyan-300 mt-2 bg-cyan-950/20 p-2 rounded border border-cyan-500/20">
                            <strong>Note:</strong> {match.customNote}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-[#0B0E17] border border-white/5 text-center space-y-1">
                <p className="text-xs text-slate-400">No match rounds scheduled yet.</p>
                {user && (user.role === 'Organizer' || user.role === 'Admin') && (tournament.organizer?._id === user._id || tournament.organizer === user._id) && (
                  <button
                    onClick={() => setShowRoomModal(true)}
                    className="mt-2 text-xs text-[#E6002B] hover:underline font-bold"
                  >
                    + Add first match round & map
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tournament Rules */}
          <div className="bg-[#10141E] rounded-xl p-6 border border-white/10 space-y-3">
            <h3 className="text-lg font-black text-white font-gaming flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#E6002B]" /> Rules & Regulations
            </h3>
            <div className="p-4 rounded-lg bg-[#0B0E17] border border-white/10 text-slate-300 text-xs leading-relaxed whitespace-pre-line font-mono">
              {tournament.rules}
            </div>
          </div>

          {/* Confirmed Teams Roster - ORGANIZER ONLY */}
          {user && (user.role === 'Organizer' && (tournament.organizer?._id === user._id || tournament.organizer === user._id || user.role === 'Admin')) ? (
            <div className="bg-[#10141E] rounded-xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white font-gaming flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#E6002B]" /> Organizer View: Confirmed Teams ({tournament.acceptedTeams?.length || 0})
                </h3>
                <Link
                  to={`/organizer/registrations/${tournament._id}`}
                  className="px-3 py-1.5 rounded-lg bg-[#E6002B] text-white font-bold text-xs uppercase font-gaming hover:bg-[#C90022] transition-colors"
                >
                  Manage All Entries ({tournament.registeredTeamsCount || 0})
                </Link>
              </div>

              {tournament.acceptedTeams && tournament.acceptedTeams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tournament.acceptedTeams.map((team) => (
                    <div key={team._id} className="p-3.5 rounded-lg bg-[#0B0E17] border border-white/10 flex items-center gap-3">
                      <img
                        src={team.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${team.name}`}
                        alt={team.name}
                        className="w-9 h-9 rounded-full border border-white/15 object-cover"
                      />
                      <div>
                        <h4 className="font-bold text-white text-xs">{team.name}</h4>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {team.country || 'Global'} • {team.players?.length || 0} Players
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No teams confirmed yet for this tournament lobby.</p>
              )}
            </div>
          ) : (
            <div className="bg-[#10141E] rounded-xl p-5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-gaming text-xs font-bold uppercase tracking-wider">
                <Lock className="w-4 h-4 text-[#E6002B]" />
                <span>Squad Lineup Privacy</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registered squads and lineup details are confidential and accessible strictly to the verified tournament organizer.
              </p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* Specification Card */}
          <div className="bg-[#10141E] rounded-xl p-5 border border-white/10 space-y-4">
            <h4 className="font-black text-white text-sm font-gaming border-b border-white/10 pb-2.5">
              Tournament Specifications
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Game Title</span>
                <span className="font-bold text-white">{tournament.game}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Platform</span>
                <span className="font-bold text-white">{tournament.platform}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Format Mode</span>
                <span className="font-bold text-white">{tournament.tournamentType}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Lineup Team Size</span>
                <span className="font-bold text-cyan-400">
                  {tournament.teamSize?.min} - {tournament.teamSize?.max} Players
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Max Teams</span>
                <span className="font-bold text-white">{tournament.maxTeams} Teams</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Start Date</span>
                <span className="font-bold text-emerald-400">{formattedStartDate}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">End Date</span>
                <span className="font-bold text-slate-300">{formattedEndDate}</span>
              </div>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="bg-[#10141E] rounded-xl p-5 border border-white/10 space-y-3">
            <h4 className="font-black text-white text-sm font-gaming">Organizer Details</h4>
            <div className="flex items-center gap-3">
              <img
                src={tournament.organizer?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${tournament.organizer?.username}`}
                alt={tournament.organizer?.name}
                className="w-10 h-10 rounded-full border border-white/15 object-cover"
              />
              <div>
                <h5 className="font-bold text-white text-xs">{tournament.organizer?.name}</h5>
                <p className="text-[11px] text-cyan-400 font-semibold">@{tournament.organizer?.username}</p>
              </div>
            </div>
            {tournament.organizer?.bio && (
              <p className="text-xs text-slate-400 leading-relaxed">
                {tournament.organizer.bio}
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Organizer Match & Room Manager Modal */}
      {showRoomModal && (
        <MatchRoomManagerModal
          tournament={tournament}
          onClose={() => setShowRoomModal(false)}
          onUpdated={() => fetchDetail(true)}
        />
      )}

    </div>
  );
}
