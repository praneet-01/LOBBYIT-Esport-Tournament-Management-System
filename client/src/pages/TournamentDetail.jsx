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
  Edit3,
  Crown,
  Flame,
  Camera,
  Award,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ListOrdered,
  Swords
} from 'lucide-react';
import MatchRoomManagerModal from '../components/organizer/MatchRoomManagerModal';
import BRGroupScoreManagerModal from '../components/organizer/BRGroupScoreManagerModal';
import BracketManagerModal from '../components/organizer/BracketManagerModal';
import TeamProofSubmitModal from '../components/tournaments/TeamProofSubmitModal';
import BracketViewer from '../components/tournaments/BracketViewer';

export default function TournamentDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [stagesData, setStagesData] = useState([]);
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBROpsModal, setShowBROpsModal] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofTarget, setProofTarget] = useState(null);

  const [copiedKey, setCopiedKey] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Active main tab: 'standings' | 'slots' | 'about' | 'bracket'
  const [activeMainTab, setActiveMainTab] = useState('standings');
  const [standingsSubTab, setStandingsSubTab] = useState('group'); // 'group' | 'stage_overall' | 'match_breakdown'
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [selectedMatchSlotIdx, setSelectedMatchSlotIdx] = useState(0);
  const [selectedBreakdownMatchIdx, setSelectedBreakdownMatchIdx] = useState(0);

  const fetchDetail = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await api.get(`/tournaments/slug/${slug}`);
      setTournament(response.data);

      const isBracketFormat = response.data.tournamentFormat === 'knockout_bracket' || response.data.tournamentFormat === 'direct_series';
      if (isBracketFormat) {
        setActiveMainTab((prev) => (prev === 'standings' || prev === 'slots' ? 'bracket' : prev));
      }

      // Fetch appropriate sub-data
      if (response.data?._id) {
        if (isBracketFormat) {
          try {
            const bracketRes = await api.get(`/tournaments/${response.data._id}/bracket`);
            setBracketData(bracketRes.data);
          } catch (e) {
            console.warn('Bracket fetch error:', e.message);
          }
        } else {
          try {
            const stagesRes = await api.get(`/tournaments/${response.data._id}/stages`);
            setStagesData(stagesRes.data.stages || []);
          } catch (e) {
            console.warn('Stages fetch error:', e.message);
          }
        }
      }
    } catch (err) {
      if (!tournament) setError(err.response?.data?.message || 'Tournament not found');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // 6-second polling for real-time match room & standings sync
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

  const isOrganizer = Boolean(
    user && 
    (user.role === 'Organizer' || user.role === 'Admin') && 
    tournament && 
    ((tournament.organizer?._id && tournament.organizer._id.toString() === user._id.toString()) || 
     (tournament.organizer && tournament.organizer.toString() === user._id.toString()))
  );

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

      {/* CHAMPIONS PODIUM (Clean Battlefy / Liquipedia Style) */}
      {(tournament.champion?.firstPlace?.teamName || tournament.status === 'completed') && (
        <div className="rounded-xl p-6 bg-[#13151D] border border-amber-500/30 relative overflow-hidden">
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-gaming font-bold uppercase tracking-wider">
              <Crown className="w-4 h-4" /> Tournament Champions
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto items-center pt-2">
              {/* 2nd Place */}
              {tournament.champion?.secondPlace?.teamName && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center order-2 sm:order-1">
                  <span className="text-2xl block mb-1">🥈</span>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase font-gaming">Runner-Up</p>
                  <p className="text-sm font-bold text-white font-gaming mt-0.5 truncate">
                    {tournament.champion.secondPlace.teamName}
                  </p>
                </div>
              )}

              {/* 1st Place Champion */}
              {tournament.champion?.firstPlace?.teamName && (
                <div className="p-5 rounded-xl bg-[#1A1E2B] border border-amber-500/40 text-center order-1 sm:order-2">
                  <span className="text-3xl block mb-1">🏆</span>
                  <p className="text-xs font-bold text-amber-400 uppercase font-gaming">Grand Champion</p>
                  <h3 className="text-lg font-black text-white font-gaming mt-0.5 tracking-wide truncate">
                    {tournament.champion.firstPlace.teamName}
                  </h3>
                </div>
              )}

              {/* 3rd Place */}
              {tournament.champion?.thirdPlace?.teamName && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center order-3">
                  <span className="text-2xl block mb-1">🥉</span>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase font-gaming">3rd Place</p>
                  <p className="text-sm font-bold text-white font-gaming mt-0.5 truncate">
                    {tournament.champion.thirdPlace.teamName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ORGANIZER ACTION BAR (Clean Battlefy Admin Style) */}
      {user && (user.role === 'Organizer' || user.role === 'Admin') && (tournament.organizer?._id === user._id || tournament.organizer === user._id) && (
        tournament.tournamentFormat === 'knockout_bracket' || tournament.tournamentFormat === 'direct_series' ? (
          <div className="p-4 rounded-xl bg-[#13151D] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 text-white flex items-center justify-center shrink-0">
                <Swords className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase font-gaming tracking-wide">
                  Organizer Bracket & Match Ops Hub
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Fixtures • Room Credentials • Match Scores • Disburse Payouts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBracketModal(true)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase font-gaming tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Swords className="w-4 h-4" /> Manage Bracket
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#13151D] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E6002B] text-white flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase font-gaming tracking-wide">
                  Battle Royale Tournament Hub
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Slots 1–16 allocation • Fast score matrix • Advance to Grand Finals • Disburse Payouts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBROpsModal(true)}
                className="px-4 py-2 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-black text-xs uppercase font-gaming tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#E6002B]/30"
              >
                <Flame className="w-4 h-4" /> Manage BR Groups & Scores
              </button>
              <button
                onClick={() => setShowRoomModal(true)}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase font-gaming transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Simple Rooms
              </button>
            </div>
          </div>
        )
      )}

      {/* MAIN NAVIGATION TABS */}
      <div className="flex border-b border-white/10 gap-2 text-xs font-gaming uppercase tracking-wider overflow-x-auto pb-1">
        {tournament.tournamentFormat === 'knockout_bracket' || tournament.tournamentFormat === 'direct_series' ? (
          <>
            <button
              onClick={() => setActiveMainTab('bracket')}
              className={`py-2.5 px-4 rounded-lg font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'bracket'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Swords className="w-4 h-4" /> Match Brackets & Fixtures
            </button>

            <button
              onClick={() => setActiveMainTab('about')}
              className={`py-2.5 px-4 rounded-lg font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'about'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" /> About & Rules
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveMainTab('standings')}
              className={`py-2.5 px-4 rounded-lg font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'standings'
                  ? 'bg-[#E6002B] text-white shadow-lg shadow-[#E6002B]/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Trophy className="w-4 h-4" /> Standings & Points Table
            </button>

            <button
              onClick={() => setActiveMainTab('slots')}
              className={`py-2.5 px-4 rounded-lg font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'slots'
                  ? 'bg-[#E6002B] text-white shadow-lg shadow-[#E6002B]/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shield className="w-4 h-4" /> Slots 1–16 & Room Credentials
            </button>

            <button
              onClick={() => setActiveMainTab('about')}
              className={`py-2.5 px-4 rounded-lg font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'about'
                  ? 'bg-[#E6002B] text-white shadow-lg shadow-[#E6002B]/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" /> About & Rules
            </button>
          </>
        )}
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE TAB CONTENT */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB: HEAD-TO-HEAD BRACKET & MATCH FIXTURES */}
          {activeMainTab === 'bracket' && (
            <BracketViewer
              tournament={tournament}
              bracket={bracketData?.bracket || tournament.bracket || []}
              champion={bracketData?.champion || tournament.champion}
              isOrganizer={user && (user.role === 'Organizer' || user.role === 'Admin') && (tournament.organizer?._id === user._id || tournament.organizer === user._id)}
              userTeam={user}
              onOpenOrganizerManager={() => setShowBracketModal(true)}
              onRefresh={() => fetchDetail(true)}
            />
          )}

          {/* TAB 1: STANDINGS & POINTS TABLE (REBUILT FROM SCRATCH) */}
          {activeMainTab === 'standings' && (
            <div className="space-y-6">
              
              {/* Grand Finals Podium & Prize Distribution Banner (Shown when champion or payouts exist) */}
              {(tournament.champion?.firstPlace?.teamName || (tournament.payoutDistribution && tournament.payoutDistribution.length > 0)) && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#14161f] to-[#10121a] border border-amber-500/30 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider font-gaming">
                        Official Championship Podium & Prize Distribution
                      </h3>
                    </div>
                    {tournament.payoutStatus === 'completed' && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase font-gaming">
                        ✓ Prize Pool Disbursed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Champion (1st Place) */}
                    <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-center space-y-1">
                      <span className="text-2xl">🏆</span>
                      <p className="text-[11px] font-black text-amber-300 uppercase font-gaming">Grand Champion</p>
                      <p className="text-base font-black text-white font-gaming">
                        {tournament.champion?.firstPlace?.teamName || tournament.payoutDistribution?.[0]?.teamName || 'Champion TBD'}
                      </p>
                      {tournament.payoutDistribution?.[0] && (
                        <p className="text-xs text-amber-400 font-bold">
                          Prize: ₹{tournament.payoutDistribution[0].amount?.toLocaleString()} • Txn: {tournament.payoutDistribution[0].txnId}
                        </p>
                      )}
                    </div>

                    {/* 1st Runner-Up (2nd Place) */}
                    <div className="p-4 rounded-xl bg-slate-300/10 border border-slate-300/30 text-center space-y-1">
                      <span className="text-2xl">🥈</span>
                      <p className="text-[11px] font-black text-slate-300 uppercase font-gaming">1st Runner-Up</p>
                      <p className="text-base font-black text-white font-gaming">
                        {tournament.champion?.secondPlace?.teamName || tournament.payoutDistribution?.[1]?.teamName || 'Runner-Up TBD'}
                      </p>
                      {tournament.payoutDistribution?.[1] && (
                        <p className="text-xs text-slate-300 font-bold">
                          Prize: ₹{tournament.payoutDistribution[1].amount?.toLocaleString()} • Txn: {tournament.payoutDistribution[1].txnId}
                        </p>
                      )}
                    </div>

                    {/* 2nd Runner-Up (3rd Place) */}
                    <div className="p-4 rounded-xl bg-amber-700/10 border border-amber-700/30 text-center space-y-1">
                      <span className="text-2xl">🥉</span>
                      <p className="text-[11px] font-black text-amber-500 uppercase font-gaming">2nd Runner-Up</p>
                      <p className="text-base font-black text-white font-gaming">
                        {tournament.champion?.thirdPlace?.teamName || tournament.payoutDistribution?.[2]?.teamName || '3rd Place TBD'}
                      </p>
                      {tournament.payoutDistribution?.[2] && (
                        <p className="text-xs text-amber-500 font-bold">
                          Prize: ₹{tournament.payoutDistribution[2].amount?.toLocaleString()} • Txn: {tournament.payoutDistribution[2].txnId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {stagesData.length > 0 ? (
                (() => {
                  const currentStage = stagesData[selectedStageIdx] || stagesData[0];
                  const currentGroup = currentStage?.groups?.[selectedGroupIdx] || currentStage?.groups?.[0];
                  const isFinalStage = currentStage?.isFinalStage || currentStage?.name?.toLowerCase().includes('final');
                  const qualifyCutoff = isFinalStage ? 0 : (currentStage?.qualifyCountPerGroup || 8);

                  // Data source according to sub-tab
                  let activeStandingsList = [];
                  if (standingsSubTab === 'stage_overall' && currentStage?.stageLeaderboard && currentStage.stageLeaderboard.length > 0) {
                    activeStandingsList = currentStage.stageLeaderboard;
                  } else {
                    activeStandingsList = currentGroup?.leaderboard || [];
                  }

                  // If matches haven't started yet, fall back to assigned slots
                  if (activeStandingsList.length === 0 && currentGroup?.teams && currentGroup.teams.length > 0) {
                    activeStandingsList = currentGroup.teams.map((t, idx) => ({
                      overallRank: idx + 1,
                      slotNumber: t.slotNumber,
                      teamId: t.team?._id || t.team,
                      teamName: t.teamName || `Slot ${t.slotNumber}`,
                      teamTag: t.teamTag || '',
                      teamLogo: t.teamLogo || '',
                      matchesPlayed: 0,
                      wwcd: 0,
                      placementPoints: 0,
                      killPoints: 0,
                      totalPoints: 0,
                      isPreDraw: true
                    }));
                  }

                  return (
                    <div className="space-y-4">
                      
                      {/* 1. Stage Selector (Round 1, Qualifiers, Grand Finals) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#12141c] border border-white/10">
                        <div className="flex items-center gap-2 overflow-x-auto">
                          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-gaming mr-1">
                            Stage:
                          </span>
                          {stagesData.map((stage, sIdx) => (
                            <button
                              key={stage._id || sIdx}
                              onClick={() => { setSelectedStageIdx(sIdx); setSelectedGroupIdx(0); }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-gaming font-bold uppercase transition-colors cursor-pointer ${
                                selectedStageIdx === sIdx
                                  ? 'bg-[#E6002B] text-white shadow'
                                  : 'bg-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {stage.name}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => fetchDetail(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs"
                            title="Refresh standings"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#E6002B]' : ''}`} />
                            <span>Sync Standings</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. Standings Sub-Navigation (Group View | Stage Overall | Match-by-Match Breakdown) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-[#12141c] border border-white/10">
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {/* Group tabs */}
                          {currentStage?.groups?.map((group, gIdx) => (
                            <button
                              key={group._id || gIdx}
                              onClick={() => {
                                setSelectedGroupIdx(gIdx);
                                setStandingsSubTab('group');
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-gaming font-bold uppercase transition-colors cursor-pointer ${
                                standingsSubTab === 'group' && selectedGroupIdx === gIdx
                                  ? 'bg-[#E6002B] text-white shadow'
                                  : 'bg-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {group.name} Table
                            </button>
                          ))}

                          {/* Stage Wide Overall Tab (Available if multiple groups exist) */}
                          {currentStage?.groups && currentStage.groups.length > 1 && (
                            <button
                              onClick={() => setStandingsSubTab('stage_overall')}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-gaming font-bold uppercase transition-colors cursor-pointer ${
                                standingsSubTab === 'stage_overall'
                                  ? 'bg-amber-500 text-black font-black shadow'
                                  : 'bg-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              ★ Stage Overall Standings
                            </button>
                          )}

                          {/* Match-by-Match Breakdown Tab */}
                          <button
                            onClick={() => setStandingsSubTab('match_breakdown')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-gaming font-bold uppercase transition-colors cursor-pointer ${
                              standingsSubTab === 'match_breakdown'
                                ? 'bg-zinc-100 text-black font-black shadow'
                                : 'bg-white/5 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Match Scorecards
                          </button>
                        </div>

                        <div className="text-xs text-zinc-400 font-gaming">
                          {isFinalStage ? (
                            <span className="text-amber-400 font-bold">🏆 Grand Finals Standings</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">Top {qualifyCutoff} Teams Advance to Next Round</span>
                          )}
                        </div>
                      </div>

                      {/* 3. SUB-TAB VIEW: MATCH BREAKDOWN SCORECARDS */}
                      {standingsSubTab === 'match_breakdown' ? (
                        <div className="space-y-4">
                          {/* Match Selector Pills */}
                          <div className="flex items-center gap-2 overflow-x-auto p-3 rounded-xl bg-[#12141c] border border-white/10">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase font-gaming">Select Match:</span>
                            {(currentGroup?.matches || []).map((m, mIdx) => (
                              <button
                                key={m._id || mIdx}
                                onClick={() => setSelectedBreakdownMatchIdx(mIdx)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-gaming font-bold uppercase transition-colors cursor-pointer ${
                                  selectedBreakdownMatchIdx === mIdx
                                    ? 'bg-[#E6002B] text-white'
                                    : 'bg-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                Match {m.matchNumber || mIdx + 1} ({m.map || 'Erangel'})
                              </button>
                            ))}
                          </div>

                          {/* Match Scorecard Table */}
                          {(() => {
                            const selectedMatch = currentGroup?.matches?.[selectedBreakdownMatchIdx] || currentGroup?.matches?.[0];
                            const matchResults = selectedMatch?.results || [];

                            // Sort match results by rank
                            const sortedResults = [...matchResults].sort((a, b) => {
                              if (a.rank && b.rank) return a.rank - b.rank;
                              if (a.rank) return -1;
                              if (b.rank) return 1;
                              return a.slotNumber - b.slotNumber;
                            });

                            return (
                              <div className="rounded-xl border border-white/10 overflow-hidden bg-[#12141c]">
                                <div className="px-5 py-3 bg-[#171a24] border-b border-white/10 flex items-center justify-between">
                                  <div>
                                    <h4 className="text-xs font-black text-white font-gaming uppercase tracking-wider">
                                      {selectedMatch?.title || `Match ${selectedBreakdownMatchIdx + 1}`} Results
                                    </h4>
                                    <p className="text-[11px] text-zinc-400">
                                      Map: <strong className="text-white">{selectedMatch?.map || 'Erangel'}</strong> • Status: <strong className="text-zinc-200 uppercase">{selectedMatch?.status || 'upcoming'}</strong>
                                    </p>
                                  </div>
                                  <span className="text-[11px] px-2.5 py-1 rounded bg-black/40 text-amber-400 font-gaming font-bold border border-amber-400/20">
                                    Official Scorecard
                                  </span>
                                </div>

                                {sortedResults.length === 0 ? (
                                  <div className="p-10 text-center text-xs text-zinc-500 space-y-2">
                                    <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
                                    <p className="text-zinc-300 font-bold">Match Pending / In Progress</p>
                                    <p>Individual match scoreboard will update here as organizer records official scores.</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-[#181a24] text-zinc-400 uppercase text-[10px] font-bold border-b border-white/10">
                                        <tr>
                                          <th className="py-3 px-4 w-16 text-center">Finished</th>
                                          <th className="py-3 px-4">Team</th>
                                          <th className="py-3 px-4 text-center">Slot</th>
                                          <th className="py-3 px-4 text-center">Finishes (Kills)</th>
                                          <th className="py-3 px-4 text-center">Place Pts</th>
                                          <th className="py-3 px-4 text-center">Kill Pts</th>
                                          <th className="py-3 px-4 text-center font-black text-white">Match Total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                        {sortedResults.map((r, idx) => {
                                          const isWWCD = r.wwcd || r.rank === 1;
                                          return (
                                            <tr
                                              key={r._id || idx}
                                              className={`hover:bg-white/5 transition-colors ${
                                                isWWCD ? 'bg-amber-500/10' : ''
                                              }`}
                                            >
                                              <td className="py-3 px-4 text-center font-bold">
                                                {isWWCD ? (
                                                  <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-black font-gaming">
                                                    🍗 WWCD #1
                                                  </span>
                                                ) : r.rank > 0 ? (
                                                  <span className="font-gaming text-zinc-300 font-bold">#{r.rank}</span>
                                                ) : (
                                                  <span className="text-zinc-600">-</span>
                                                )}
                                              </td>
                                              <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                                                {r.teamLogo ? (
                                                  <img src={r.teamLogo} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                ) : (
                                                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold">
                                                    {r.teamName?.[0] || 'T'}
                                                  </div>
                                                )}
                                                <span className="truncate">{r.teamName || `Slot ${r.slotNumber}`}</span>
                                              </td>
                                              <td className="py-3 px-4 text-center text-zinc-400 font-mono">
                                                Slot {r.slotNumber}
                                              </td>
                                              <td className="py-3 px-4 text-center font-bold text-zinc-200">
                                                {r.kills || 0}
                                              </td>
                                              <td className="py-3 px-4 text-center text-zinc-300">
                                                {r.placementPoints || 0}
                                              </td>
                                              <td className="py-3 px-4 text-center text-zinc-300">
                                                {r.killPoints || 0}
                                              </td>
                                              <td className="py-3 px-4 text-center font-black text-amber-400 text-sm">
                                                {r.totalPoints || 0}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        /* 4. MAIN STANDINGS TABLE (Group Standings OR Stage Overall) */
                        <div className="rounded-xl border border-white/10 overflow-hidden bg-[#12141c]">
                          
                          {/* Table Header Details */}
                          <div className="px-5 py-3.5 bg-[#171a24] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-xs font-black text-white font-gaming uppercase tracking-wider flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                {standingsSubTab === 'stage_overall' 
                                  ? `${currentStage?.name} • Stage Overall Standings (Combined)` 
                                  : `${currentStage?.name} • ${currentGroup?.name} Standings`}
                              </h3>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                Cumulative Points = Placement Pts + Finishes (1 pt/kill) • Official BGIS Tiebreaker Applied
                              </p>
                            </div>

                            <div>
                              {isFinalStage ? (
                                <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-md font-bold uppercase font-gaming">
                                  🏆 Podium Decider
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md font-bold uppercase font-gaming">
                                  Top {qualifyCutoff} Teams Advance to Next Round
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Standings Table Body */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#181a24] text-zinc-400 uppercase text-[10px] font-bold border-b border-white/10">
                                <tr>
                                  <th className="py-3 px-4 w-14 text-center">Rank</th>
                                  <th className="py-3 px-4">Team</th>
                                  <th className="py-3 px-3 text-center">Slot</th>
                                  <th className="py-3 px-3 text-center">Matches</th>
                                  <th className="py-3 px-3 text-center font-bold text-amber-400">WWCD 🍗</th>
                                  <th className="py-3 px-3 text-center">Place Pts</th>
                                  <th className="py-3 px-3 text-center">Finishes</th>
                                  <th className="py-3 px-4 text-center font-black text-white">Total Pts</th>
                                  <th className="py-3 px-4 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {activeStandingsList.map((team, idx) => {
                                  const rankNum = team.overallRank || idx + 1;
                                  const isChamp = isFinalStage && rankNum === 1;
                                  const isRunner1 = isFinalStage && rankNum === 2;
                                  const isRunner2 = isFinalStage && rankNum === 3;
                                  const isQualified = !isFinalStage && rankNum <= qualifyCutoff;
                                  const isEliminated = !isFinalStage && rankNum > qualifyCutoff && team.matchesPlayed > 0;

                                      return (
                                        <React.Fragment key={team.teamId || idx}>
                                          <tr
                                            className={`hover:bg-white/5 transition-colors ${
                                              isChamp 
                                                ? 'bg-amber-500/10' 
                                                : isRunner1 
                                                ? 'bg-slate-300/10' 
                                                : isRunner2 
                                                ? 'bg-amber-700/10' 
                                                : isQualified 
                                                ? 'bg-emerald-500/5' 
                                                : ''
                                            }`}
                                          >
                                            {/* Rank Badge */}
                                            <td className="py-3 px-4 text-center font-bold">
                                              <span className={`w-8 h-7 rounded-md inline-flex items-center justify-center text-xs font-gaming font-black ${
                                                isChamp
                                                  ? 'bg-amber-400 text-black shadow'
                                                  : isRunner1
                                                  ? 'bg-slate-300 text-black'
                                                  : isRunner2
                                                  ? 'bg-amber-600 text-white'
                                                  : isQualified
                                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                  : 'bg-white/5 text-zinc-400'
                                              }`}>
                                                {isChamp ? '🏆 1' : isRunner1 ? '🥈 2' : isRunner2 ? '🥉 3' : `#${rankNum}`}
                                              </span>
                                            </td>

                                            {/* Team Name & Logo */}
                                            <td className="py-3 px-4 font-bold text-white">
                                              <div className="flex items-center gap-2.5">
                                                {team.teamLogo ? (
                                                  <img src={team.teamLogo} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                                                ) : (
                                                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">
                                                    {team.teamName?.[0] || 'T'}
                                                  </div>
                                                )}
                                                <div className="min-w-0">
                                                  <p className="truncate font-gaming font-bold text-sm tracking-wide text-white">
                                                    {team.teamName}
                                                  </p>
                                                  {team.groupName && (
                                                    <p className="text-[10px] text-zinc-400 font-mono">
                                                      {team.groupName}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </td>

                                            {/* Slot */}
                                            <td className="py-3 px-3 text-center text-zinc-400 font-mono font-semibold text-xs">
                                              Slot {team.slotNumber || (idx + 1)}
                                            </td>

                                            {/* Matches Played */}
                                            <td className="py-3 px-3 text-center text-zinc-300 font-semibold">
                                              {team.matchesPlayed || 0}
                                            </td>

                                            {/* WWCD (Wins) */}
                                            <td className="py-3 px-3 text-center font-black text-amber-400 font-gaming text-sm">
                                              {team.wwcd || 0}
                                            </td>

                                            {/* Placement Points */}
                                            <td className="py-3 px-3 text-center text-zinc-300 font-semibold">
                                              {team.placementPoints || 0}
                                            </td>

                                            {/* Finishes / Kill Points */}
                                            <td className="py-3 px-3 text-center text-zinc-300 font-semibold">
                                              {team.killPoints || 0}
                                            </td>

                                            {/* Total Points */}
                                            <td className="py-3 px-4 text-center font-black text-amber-300 font-gaming text-base">
                                              {team.totalPoints || 0}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3 px-4 text-center">
                                              {isChamp ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-gaming font-black bg-amber-400 text-black">
                                                  CHAMPION
                                                </span>
                                              ) : isRunner1 ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-gaming font-black bg-slate-300 text-black">
                                                  RUNNER-UP
                                                </span>
                                              ) : isRunner2 ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-gaming font-black bg-amber-600 text-white">
                                                  3RD PODIUM
                                                </span>
                                              ) : isQualified ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-gaming font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                  QUALIFIED
                                                </span>
                                              ) : isEliminated ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-gaming font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                  ELIMINATED
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-gaming text-zinc-500 bg-white/5">
                                                  ENROLLED
                                                </span>
                                              )}
                                            </td>
                                          </tr>

                                          {/* Battlefy Qualification Cutoff Line */}
                                          {qualifyCutoff > 0 && rankNum === qualifyCutoff && idx < activeStandingsList.length - 1 && (
                                            <tr className="bg-emerald-500/10 border-y border-emerald-500/40">
                                              <td colSpan={9} className="py-1.5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2 text-[10px] font-bold font-gaming text-emerald-400 uppercase tracking-widest">
                                                  <span>───</span>
                                                  <span>TOP {qualifyCutoff} ADVANCE TO NEXT ROUND</span>
                                                  <span>───</span>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Footer Legend */}
                          <div className="px-5 py-3 bg-[#14161f] border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-zinc-400">
                            <div>
                              <strong>Scoring Rules:</strong> #1 = 10 pts, #2 = 6 pts, #3 = 5 pts, #4 = 4 pts, #5 = 3 pts, #6 = 2 pts, #7-8 = 1 pt + 1 pt per kill.
                            </div>
                            <div>
                              Tiebreakers: Total Points → WWCDs → Placement Points → Finishes.
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })()
              ) : (
                /* No Stage Setup Yet */
                <div className="bg-[#12141c] rounded-2xl p-10 text-center border border-white/10 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                    <Users className="w-7 h-7 text-[#E6002B]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white font-gaming uppercase tracking-wide">
                      Tournament Stage Awaiting Draw • {tournament.registeredTeamsCount || 0} Teams Registered
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-lg mx-auto mt-1">
                      {isOrganizer
                        ? 'Teams have registered. Create the initial tournament stage (Round 1 / Qualifiers) and auto-allocate teams into Slots 1 to 16.'
                        : 'Teams are registered. The tournament organizer will conduct the slot draw and match scheduling prior to kickoff.'}
                    </p>
                  </div>
                  {isOrganizer && (
                    <button
                      onClick={() => setShowBROpsModal(true)}
                      className="px-6 py-3 rounded-xl bg-[#E6002B] hover:bg-[#ff1f4b] text-white font-black text-xs uppercase font-gaming tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Flame className="w-4 h-4" /> Form Groups & Allocate Slots
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: 16-TEAM SLOTS & ROOM CREDENTIALS */}
          {activeMainTab === 'slots' && (
            <div className="space-y-5">
              {stagesData.length > 0 ? (
                (() => {
                  const currentStage = stagesData[selectedStageIdx] || stagesData[0];
                  const currentGroup = currentStage?.groups?.[selectedGroupIdx] || currentStage?.groups?.[0];
                  const activeMatch = currentGroup?.matches?.[selectedMatchSlotIdx] || currentGroup?.matches?.[0];

                  return (
                    <div className="space-y-4">
                      {/* Group & Match Selector Bar */}
                      <div className="p-4 rounded-xl bg-[#10141E] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 overflow-x-auto">
                            {currentStage?.groups?.map((group, gIdx) => (
                              <button
                                key={group._id || gIdx}
                                onClick={() => { setSelectedGroupIdx(gIdx); setSelectedMatchSlotIdx(0); }}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-gaming font-black uppercase transition-colors cursor-pointer ${
                                  selectedGroupIdx === gIdx
                                    ? 'bg-[#E6002B] text-white shadow-md shadow-[#E6002B]/20'
                                    : 'bg-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                {group.name}
                              </button>
                            ))}
                          </div>

                          {currentGroup?.matches && currentGroup.matches.length > 1 && (
                            <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                              {currentGroup.matches.map((m, mIdx) => (
                                <button
                                  key={m._id || mIdx}
                                  onClick={() => setSelectedMatchSlotIdx(mIdx)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-gaming uppercase font-bold transition-all cursor-pointer ${
                                    (selectedMatchSlotIdx || 0) === mIdx
                                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm'
                                      : 'bg-white/5 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Match {m.matchNumber} ({m.map}) {m.status === 'completed' ? '✓' : ''}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {activeMatch && !isOrganizer && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setProofTarget({ stage: currentStage, group: currentGroup, match: activeMatch });
                                setShowProofModal(true);
                              }}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase font-gaming tracking-wide border border-cyan-400/30 flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
                            >
                              <Camera className="w-4 h-4 text-cyan-200" /> Submit Match Proof
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Active Match Room Credentials Block */}
                      {activeMatch && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/20 via-[#10141E] to-[#121826] border border-emerald-500/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span className="text-xs font-black text-white font-gaming uppercase">
                                {activeMatch.title || `Match ${activeMatch.matchNumber}`}
                              </span>
                              <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded font-bold uppercase font-gaming">
                                🗺️ {activeMatch.map}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">
                              Status: <strong className="text-white uppercase">{activeMatch.status}</strong>
                            </span>
                          </div>

                          {/* Credentials Grid */}
                          {tournament.isRoomUnlocked ? (
                            activeMatch.roomId ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-black/60 border border-white/10 text-xs">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                      <Hash className="w-3 h-3 text-cyan-400" /> Room ID
                                    </span>
                                    <span className="font-mono font-bold text-white text-sm">
                                      {activeMatch.roomId}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(activeMatch.roomId, `br-room-${activeMatch._id}`)}
                                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === `br-room-${activeMatch._id}` ? <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                      <Key className="w-3 h-3 text-emerald-400" /> Password
                                    </span>
                                    <span className="font-mono font-bold text-emerald-400 text-sm">
                                      {showPasswordMap[activeMatch._id] ? activeMatch.password || 'None' : '••••••••'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => togglePasswordVisibility(activeMatch._id)}
                                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                                    >
                                      {showPasswordMap[activeMatch._id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => copyToClipboard(activeMatch.password, `br-pass-${activeMatch._id}`)}
                                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                                    >
                                      {copiedKey === `br-pass-${activeMatch._id}` ? <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-center text-xs text-slate-400">
                                ⏳ Room ID & Password will be released 10-15 mins before match start.
                              </div>
                            )
                          ) : (
                            <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                              <Lock className="w-3.5 h-3.5 text-[#E6002B]" />
                              <span>Room ID & Password unlocked strictly for accepted teams participating in this match.</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 16 Slots Grid View */}
                      <div className="bg-[#10141E] rounded-xl p-5 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <div>
                            <h3 className="text-xs font-black text-white font-gaming uppercase tracking-wide">
                              {currentGroup?.name} Official Slot Allocations (Slots 1 to 16)
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Every squad must join their assigned custom room slot in-game. Spectator slots are kept separate.
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded border border-cyan-400/20 font-gaming">
                            16 Teams / Lobby
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Array.from({ length: 16 }).map((_, slotIdx) => {
                            const slotNum = slotIdx + 1;
                            const slotTeam = currentGroup?.teams?.find((t) => t.slotNumber === slotNum);

                            return (
                              <div
                                key={slotNum}
                                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                                  slotTeam
                                    ? 'bg-[#0B0E17] border-white/10 hover:border-cyan-400/40'
                                    : 'bg-white/2 border-dashed border-white/5 text-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-gaming font-black text-xs text-white">
                                    #{slotNum}
                                  </span>
                                  {slotTeam ? (
                                    <div>
                                      <p className="font-bold text-xs text-white truncate">{slotTeam.teamName}</p>
                                      {slotTeam.teamTag && (
                                        <span className="text-[10px] text-cyan-400 font-semibold font-mono">[{slotTeam.teamTag}]</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-600 italic">Open Slot</span>
                                  )}
                                </div>

                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-gaming ${
                                  slotTeam ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600 bg-white/5'
                                }`}>
                                  Slot {slotNum}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })()
              ) : (
                <div className="bg-[#10141E] rounded-xl p-8 text-center border border-white/10 space-y-3">
                  <Shield className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white font-gaming">No Slot Allocations Yet</h4>
                  <p className="text-xs text-slate-400">
                    The tournament organizer will assign Slots 1 through 16 before the match begins.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ABOUT & RULES */}
          {activeMainTab === 'about' && (
            <div className="space-y-6">
              {/* About Tournament */}
              <div className="bg-[#10141E] rounded-xl p-6 border border-white/10 space-y-3">
                <h3 className="text-lg font-black text-white font-gaming flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" /> About Tournament
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {tournament.description}
                </p>
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
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: SPECS & ORGANIZER */}
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

      {/* MODAL 1: Battle Royale Groups, 16 Slots & Scoring Manager */}
      {showBROpsModal && (
        <BRGroupScoreManagerModal
          tournament={tournament}
          onClose={() => setShowBROpsModal(false)}
          onUpdated={() => fetchDetail(true)}
        />
      )}

      {/* MODAL 2: Simple Match Room Manager Modal */}
      {showRoomModal && (
        <MatchRoomManagerModal
          tournament={tournament}
          onClose={() => setShowRoomModal(false)}
          onUpdated={() => fetchDetail(true)}
        />
      )}

      {/* MODAL 3: Team Captain Screenshot Proof Modal */}
      {showProofModal && proofTarget && (
        <TeamProofSubmitModal
          tournament={tournament}
          stage={proofTarget.stage}
          group={proofTarget.group}
          match={proofTarget.match}
          userTeam={user}
          onClose={() => { setShowProofModal(false); setProofTarget(null); }}
          onSubmitted={() => fetchDetail(true)}
        />
      )}

      {/* MODAL 4: Bracket & Head-to-Head Manager Modal */}
      {showBracketModal && (
        <BracketManagerModal
          tournament={tournament}
          isOpen={showBracketModal}
          onClose={() => setShowBracketModal(false)}
          onSuccess={() => fetchDetail(true)}
        />
      )}

    </div>
  );
}
