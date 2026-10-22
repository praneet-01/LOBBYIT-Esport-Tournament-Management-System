import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  Gamepad2, 
  MapPin, 
  Key, 
  Hash, 
  RefreshCw, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Clock, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Trophy, 
  Compass, 
  ShieldAlert, 
  ExternalLink,
  BellRing
} from 'lucide-react';

export default function MyMatches() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'live', 'upcoming'
  const [copiedKey, setCopiedKey] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [lastSynced, setLastSynced] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [newRoomAlert, setNewRoomAlert] = useState(null);

  const prevMatchesRef = useRef({});

  const fetchMatches = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await api.get('/registrations/my-matches');
      const matchesData = response.data?.matches || [];
      setData(matchesData);
      setLastSynced(new Date());
      setSecondsAgo(0);

      // Check for newly released room credentials to alert player
      matchesData.forEach((item) => {
        const t = item.tournament;
        if (!t?.matches) return;
        t.matches.forEach((m) => {
          if (m.roomId && m.status !== 'completed') {
            const prevRoom = prevMatchesRef.current[m._id];
            if (!prevRoom && prevMatchesRef.current.initialized) {
              setNewRoomAlert({
                tourneyTitle: t.title,
                map: m.map,
                roomId: m.roomId,
                password: m.password,
                title: m.title
              });
            }
            prevMatchesRef.current[m._id] = m.roomId;
          }
        });
      });
      prevMatchesRef.current.initialized = true;

    } catch (err) {
      console.error('Failed to load registered matches:', err.message);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMatches();
  }, []);

  // 5-second interval real-time polling (meets user requirement to see credentials within 10s!)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchMatches(false);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  // Seconds counter timer for visual feedback
  useEffect(() => {
    const counter = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(counter);
  }, []);

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

  // Filter tournaments/matches based on tab
  const filteredData = data.filter((item) => {
    if (activeTab === 'all') return true;
    const tourneyMatches = item.tournament?.matches || [];
    if (activeTab === 'live') {
      return tourneyMatches.some((m) => m.status === 'live' || Boolean(m.roomId && m.status !== 'completed'));
    }
    if (activeTab === 'upcoming') {
      return tourneyMatches.some((m) => m.status === 'upcoming');
    }
    return true;
  });

  return (
    <div className="min-h-[85vh] bg-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <Sidebar mode="team" />

          <div className="flex-1 space-y-6">
            
            {/* Header & Live Polling Status */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#10141E] via-[#141926] to-[#0A0D14] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    REAL-TIME LOBBY SYNC (5s)
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide uppercase">
                  MY MATCHES & ROOM CREDENTIALS
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  View scheduled maps, custom Room IDs, and passwords for all your registered tournament events.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  Synced {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}
                </span>
                <button
                  onClick={() => fetchMatches(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141824] hover:bg-[#1A2030] text-slate-200 hover:text-white border border-white/10 text-xs font-bold font-gaming uppercase transition-all cursor-pointer"
                  title="Check for newly released Room IDs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Instant Alert for New Room IDs */}
            {newRoomAlert && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#10141E] to-black border-2 border-emerald-500 text-white flex items-start justify-between gap-3 animate-bounce">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500 text-black">
                    <BellRing className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-400 uppercase font-gaming">
                      🚨 NEW ROOM CREDENTIALS RELEASED!
                    </h3>
                    <p className="text-xs text-slate-200 mt-0.5">
                      <strong>{newRoomAlert.tourneyTitle}</strong> has published credentials for <strong>{newRoomAlert.map}</strong>.
                    </p>
                    <div className="mt-2 flex items-center gap-3 font-mono text-xs">
                      <span className="px-2 py-1 rounded bg-black/60 border border-white/10">Room ID: <strong>{newRoomAlert.roomId}</strong></span>
                      <span className="px-2 py-1 rounded bg-black/60 border border-white/10">Password: <strong>{newRoomAlert.password}</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setNewRoomAlert(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/10"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-gaming transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#E6002B] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All Registered Events ({data.length})
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-gaming transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'live'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Room IDs
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-gaming transition-all cursor-pointer ${
                  activeTab === 'upcoming'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Upcoming Matches
              </button>
            </div>

            {/* Match Cards List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : filteredData.length > 0 ? (
              <div className="space-y-6">
                {filteredData.map((item) => {
                  const t = item.tournament;
                  const matches = t?.matches || [];
                  const activeMatchCount = matches.filter((m) => m.status === 'live' || Boolean(m.roomId && m.status !== 'completed')).length;

                  return (
                    <div
                      key={item.registrationId}
                      className="rounded-2xl bg-[#10141E] border border-white/10 overflow-hidden shadow-xl hover:border-white/20 transition-all"
                    >
                      {/* Tournament Card Header */}
                      <div className="p-5 bg-gradient-to-r from-[#141926] via-[#10141E] to-[#0A0D14] border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {t?.banner && (
                            <img
                              src={t.banner}
                              alt={t.title}
                              className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl object-cover border border-white/10 shadow-md shrink-0"
                            />
                          )}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-gaming">
                                {t?.game}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                                {t?.tournamentType} • {t?.platform}
                              </span>
                              <StatusBadge status={item.registrationStatus} type="registration" />
                              {activeMatchCount > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                                  <Radio className="w-3 h-3" /> {activeMatchCount} Live Room{activeMatchCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            <h2 className="text-lg sm:text-xl font-bold text-white font-gaming">
                              {t?.title}
                            </h2>

                            <p className="text-xs text-slate-400">
                              Registered Squad: <strong className="text-white">{item.teamName}</strong>
                              {item.players?.length ? ` • ${item.players.length} Players` : ''}
                              {t?.organizer?.name ? ` • Host: ${t.organizer.name}` : ''}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/tournaments/${t?.slug}`}
                          className="self-start md:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141824] hover:bg-[#1A2030] text-slate-200 hover:text-white border border-white/10 text-xs font-bold font-gaming transition-colors"
                        >
                          View Tournament Lobby <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Matches Section for this Tournament */}
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-gaming flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4 text-[#E6002B]" />
                            Match Rounds & Maps ({matches.length})
                          </h3>
                          <span className="text-[11px] text-slate-500">
                            Auto-syncing credentials every 5s
                          </span>
                        </div>

                        {matches.length === 0 ? (
                          <div className="p-6 rounded-xl bg-[#0B0E17] border border-white/5 text-center space-y-1">
                            <Clock className="w-6 h-6 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-400 font-semibold">Organizer hasn't released match maps yet.</p>
                            <p className="text-[11px] text-slate-500">
                              Once the organizer creates the custom room, the Map name, Room ID, and Password will appear here automatically.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matches.map((match, idx) => {
                              const hasRoom = Boolean(match.roomId);
                              const isLive = match.status === 'live' || (hasRoom && match.status !== 'completed');
                              const isPasswordVisible = showPasswordMap[match._id];

                              return (
                                <div
                                  key={match._id || idx}
                                  className={`rounded-xl p-4 border transition-all ${
                                    isLive
                                      ? 'bg-gradient-to-br from-emerald-950/30 via-[#0E121C] to-[#0A0D14] border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                                      : match.status === 'completed'
                                      ? 'bg-[#0B0E17]/60 border-white/5 opacity-75'
                                      : 'bg-[#0B0E17] border-white/10'
                                  }`}
                                >
                                  {/* Match Header */}
                                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-mono font-bold text-white text-xs">
                                        #{match.matchNumber || idx + 1}
                                      </span>
                                      <span className="font-bold text-white text-xs font-gaming">
                                        {match.title || `Match ${match.matchNumber || idx + 1}`}
                                      </span>
                                    </div>

                                    {/* Map Pill */}
                                    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-400 border border-orange-500/30 font-gaming">
                                      🗺️ {match.map}
                                    </span>
                                  </div>

                                  {/* Status indicator */}
                                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                      {isLive ? (
                                        <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider">
                                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                          ROOM OPEN / LIVE
                                        </span>
                                      ) : match.status === 'completed' ? (
                                        <span className="text-slate-400 uppercase font-semibold">
                                          Match Finished
                                        </span>
                                      ) : (
                                        <span className="text-amber-300 uppercase font-semibold flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> Scheduled Match
                                        </span>
                                      )}
                                    </div>

                                    {match.credentialsSharedAt && (
                                      <span className="text-[10px] text-slate-500">
                                        Released {new Date(match.credentialsSharedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>

                                  {/* Custom Room Credentials Box */}
                                  <div className="mt-3 p-3 rounded-lg bg-black/60 border border-white/10 space-y-2.5">
                                    {item.registrationStatus === 'pending' ? (
                                      <div className="py-2.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 font-gaming uppercase tracking-wide">
                                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Pending Organizer Approval
                                        </div>
                                        <p className="text-[11px] text-amber-200/80 leading-relaxed">
                                          Your squad entry is awaiting organizer review. Room ID & Password will unlock automatically within 5 seconds once accepted.
                                        </p>
                                      </div>
                                    ) : item.registrationStatus === 'rejected' ? (
                                      <div className="py-2.5 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center space-y-1">
                                        <div className="text-xs font-bold text-red-400 font-gaming uppercase tracking-wide">
                                          Registration Declined
                                        </div>
                                        <p className="text-[11px] text-red-300/80">
                                          This squad registration was declined by the organizer. Match credentials remain locked.
                                        </p>
                                      </div>
                                    ) : hasRoom ? (
                                      <>
                                        {/* Room ID */}
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                                              <Hash className="w-3 h-3 text-cyan-400" /> Room ID
                                            </span>
                                            <span className="font-mono font-bold text-white text-base tracking-wider selection:bg-cyan-500">
                                              {match.roomId}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() => copyToClipboard(match.roomId, `room-${match._id}`)}
                                            className="px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                            title="Copy Room ID"
                                          >
                                            {copiedKey === `room-${match._id}` ? (
                                              <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied!</span>
                                            ) : (
                                              <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                                            )}
                                          </button>
                                        </div>

                                        {/* Room Password */}
                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                          <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                                              <Key className="w-3 h-3 text-emerald-400" /> Password
                                            </span>
                                            <span className="font-mono font-bold text-emerald-400 text-sm tracking-wider">
                                              {isPasswordVisible ? (
                                                match.password || <span className="italic text-slate-500">None</span>
                                              ) : (
                                                '••••••••••'
                                              )}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => togglePasswordVisibility(match._id)}
                                              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                                              title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                                            >
                                              {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                              onClick={() => copyToClipboard(match.password, `pass-${match._id}`)}
                                              className="px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                              title="Copy Password"
                                            >
                                              {copiedKey === `pass-${match._id}` ? (
                                                <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied!</span>
                                              ) : (
                                                <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="py-2 text-center space-y-1">
                                        <span className="text-xs font-semibold text-slate-400 block">
                                          ⏳ Room ID & Password Pending
                                        </span>
                                        <span className="text-[10px] text-slate-500 block">
                                          Organizer will share room details 10-15 mins before match start. Auto-sync is active.
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Custom Note from Organizer */}
                                  {match.customNote && (
                                    <div className="mt-2.5 p-2 rounded bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-300">
                                      <strong>Note:</strong> {match.customNote}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#10141E] border border-white/10 text-center space-y-4">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white font-gaming uppercase">No Registered Tournaments Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You haven't registered for any tournaments or events yet. Browse our active tournament lobbies and register your squad to unlock custom match rooms.
                </p>
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase font-gaming transition-all shadow-lg shadow-[#E6002B]/20"
                >
                  <Compass className="w-4 h-4" /> Browse Active Tournaments
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
