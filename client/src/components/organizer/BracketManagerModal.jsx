import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Swords, 
  Shuffle, 
  Shield, 
  Key, 
  Check, 
  AlertCircle, 
  Crown, 
  ChevronRight, 
  Sparkles,
  RefreshCw,
  X,
  Plus
} from 'lucide-react';
import api from '../../services/api';

export default function BracketManagerModal({ 
  tournament, 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [activeTab, setActiveTab] = useState('score'); // 'draw', 'score', 'advance'
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Draw Generator State
  const [seriesLength, setSeriesLength] = useState(tournament?.seriesLength || 3);
  const [matchType, setMatchType] = useState(tournament?.matchType || '4v4');
  const [shuffleTeams, setShuffleTeams] = useState(true);

  // Match Scoring State
  const [selectedRoundNum, setSelectedRoundNum] = useState(1);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [mapName, setMapName] = useState('');
  const [matchStatus, setMatchStatus] = useState('upcoming');
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [games, setGames] = useState([]);

  useEffect(() => {
    if (isOpen && tournament?._id) {
      fetchBracket();
    }
  }, [isOpen, tournament?._id]);

  const fetchBracket = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/tournaments/${tournament._id}/bracket`);
      setBracketData(res.data);
      const rounds = res.data.bracket || [];
      if (rounds.length > 0) {
        const lastRound = rounds[rounds.length - 1];
        setSelectedRoundNum(lastRound.roundNumber);
        if (lastRound.matches?.length > 0) {
          selectMatch(lastRound.matches[0]);
        }
      } else {
        setActiveTab('draw');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tournament bracket');
    } finally {
      setLoading(false);
    }
  };

  const selectMatch = (match) => {
    setSelectedMatchId(match._id);
    setRoomId(match.roomId || '');
    setPassword(match.password || '');
    setMapName(match.map || '');
    setMatchStatus(match.status || 'upcoming');
    setTeam1Score(match.team1?.score || 0);
    setTeam2Score(match.team2?.score || 0);

    // If individual games exist, populate them, otherwise generate default empty games
    if (match.games && match.games.length > 0) {
      setGames(match.games.map((g) => ({ ...g })));
    } else {
      const defaultGames = [];
      const count = match.bestOf || 3;
      for (let i = 1; i <= count; i++) {
        defaultGames.push({
          gameNumber: i,
          map: `Game ${i}`,
          team1Score: 0,
          team2Score: 0,
          status: 'upcoming'
        });
      }
      setGames(defaultGames);
    }
  };

  const handleGameScoreChange = (gameIdx, field, val) => {
    setGames((prev) => {
      const copy = [...prev];
      copy[gameIdx] = { ...copy[gameIdx], [field]: Number(val) };

      // Recompute game winner & total wins
      let t1Wins = 0;
      let t2Wins = 0;
      copy.forEach((g) => {
        if (g.team1Score > g.team2Score && (g.team1Score > 0 || g.status === 'completed')) {
          t1Wins++;
          g.status = 'completed';
        } else if (g.team2Score > g.team1Score && (g.team2Score > 0 || g.status === 'completed')) {
          t2Wins++;
          g.status = 'completed';
        }
      });
      setTeam1Score(t1Wins);
      setTeam2Score(t2Wins);

      return copy;
    });
  };

  // Generate Fixture Draw
  const handleGenerateDraw = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/tournaments/${tournament._id}/bracket/generate`, {
        seriesLength: Number(seriesLength),
        matchType,
        shuffle: shuffleTeams
      });
      setSuccessMsg(res.data.message || 'Draw generated successfully!');
      await fetchBracket();
      setActiveTab('score');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate bracket draw');
    } finally {
      setSaving(false);
    }
  };

  // Save Score & Credentials for Selected Match
  const handleSaveMatchScore = async () => {
    if (!selectedMatchId) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        roomId,
        password,
        map: mapName,
        status: matchStatus,
        team1Score: Number(team1Score),
        team2Score: Number(team2Score),
        games
      };

      const res = await api.put(
        `/tournaments/${tournament._id}/bracket/round/${selectedRoundNum}/match/${selectedMatchId}`,
        payload
      );
      setSuccessMsg(res.data.message || 'Match score saved successfully!');
      await fetchBracket();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update match score');
    } finally {
      setSaving(false);
    }
  };

  // Advance Winners to Next Round
  const handleAdvanceRound = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/tournaments/${tournament._id}/bracket/advance`);
      setSuccessMsg(res.data.message || 'Next round generated successfully!');
      await fetchBracket();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to advance bracket');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const rounds = bracketData?.bracket || [];
  const activeRound = rounds.find((r) => r.roundNumber === selectedRoundNum) || rounds[0];
  const activeMatch = activeRound?.matches?.find((m) => m._id === selectedMatchId) || activeRound?.matches?.[0];

  // Check if current active round is completely finished
  const currentRoundMatches = activeRound?.matches || [];
  const allCurrentRoundMatchesCompleted = currentRoundMatches.length > 0 && 
    currentRoundMatches.every((m) => m.status === 'completed' || !!m.winner?.team);
  const advancingWinners = currentRoundMatches.filter((m) => m.winner?.team).map((m) => m.winner);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0D111A] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#121624]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Swords className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-gaming tracking-wide uppercase">
                BRACKET & MATCH MANAGER
              </h2>
              <p className="text-xs text-slate-400">
                Generate tournament draw, update game scores, and advance winners.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-3 bg-black/40 border-b border-white/10">
          <button
            onClick={() => setActiveTab('score')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-gaming uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'score'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Scores & Rooms</span>
          </button>

          <button
            onClick={() => setActiveTab('advance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-gaming uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'advance'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>Advance Round ({advancingWinners.length}/{currentRoundMatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('draw')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-gaming uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>Generate / Reset Draw</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: ENTER SCORES & ROOM CREDENTIALS */}
          {activeTab === 'score' && (
            <div className="space-y-6">
              {rounds.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-black/30 border border-white/10 space-y-3">
                  <p className="text-sm text-slate-300">
                    No bracket has been generated yet.
                  </p>
                  <button
                    onClick={() => setActiveTab('draw')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-gaming uppercase tracking-wider"
                  >
                    Go to Draw Generator
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Match Fixture Selector */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase font-gaming">
                        Select Round
                      </label>
                      <select
                        value={selectedRoundNum}
                        onChange={(e) => {
                          const rNum = Number(e.target.value);
                          setSelectedRoundNum(rNum);
                          const r = rounds.find((x) => x.roundNumber === rNum);
                          if (r?.matches?.length > 0) selectMatch(r.matches[0]);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-white/15 text-white text-xs font-bold"
                      >
                        {rounds.map((r) => (
                          <option key={r.roundNumber} value={r.roundNumber}>
                            {r.roundName} ({r.matches?.length} Matches)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase font-gaming">
                        Select Match Fixture
                      </label>
                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {activeRound?.matches?.map((m) => (
                          <div
                            key={m._id}
                            onClick={() => selectMatch(m)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedMatchId === m._id
                                ? 'bg-cyan-500/20 border-cyan-400 text-white'
                                : 'bg-[#121624] border-white/5 text-slate-300 hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                              <span className="font-bold text-cyan-400 font-gaming">Match {m.matchNumber}</span>
                              <span className={m.status === 'completed' ? 'text-green-400' : 'text-slate-400'}>
                                {m.status}
                              </span>
                            </div>
                            <div className="text-xs font-bold font-gaming flex items-center justify-between">
                              <span className="truncate">{m.team1?.teamName}</span>
                              <span className="text-amber-400 font-mono mx-1">
                                {m.team1?.score} - {m.team2?.score}
                              </span>
                              <span className="truncate">{m.team2?.teamName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (2 cols): Active Match Details & Score Entry */}
                  {activeMatch ? (
                    <div className="md:col-span-2 space-y-5 bg-[#121624] p-5 rounded-2xl border border-white/10">
                      
                      {/* Match Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                          <span className="text-xs font-bold text-cyan-400 font-gaming uppercase">
                            Match {activeMatch.matchNumber} • {activeRound?.roundName}
                          </span>
                          <h4 className="text-base font-bold text-white font-gaming mt-0.5">
                            {activeMatch.team1?.teamName} vs {activeMatch.team2?.teamName}
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold text-amber-400">
                          Best of {activeMatch.bestOf || 3} (First to {Math.ceil((activeMatch.bestOf || 3) / 2)})
                        </span>
                      </div>

                      {/* Room Credentials & Arena Settings */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-400">
                            Custom Room ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 849201"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-400">
                            Room Password
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 1234"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-400">
                            Match Status
                          </label>
                          <select
                            value={matchStatus}
                            onChange={(e) => setMatchStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="live">Live Now</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      {/* Series Wins Summary */}
                      <div className="p-4 rounded-xl bg-black/40 border border-white/10 grid grid-cols-2 gap-4 text-center">
                        <div>
                          <span className="text-xs font-bold text-slate-400 block font-gaming mb-1">
                            {activeMatch.team1?.teamName} Wins
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={activeMatch.bestOf || 3}
                            value={team1Score}
                            onChange={(e) => setTeam1Score(e.target.value)}
                            className="w-20 px-3 py-2 text-center rounded-xl bg-[#141824] border border-white/20 text-white font-mono text-xl font-black mx-auto"
                          />
                        </div>

                        <div>
                          <span className="text-xs font-bold text-slate-400 block font-gaming mb-1">
                            {activeMatch.team2?.teamName} Wins
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={activeMatch.bestOf || 3}
                            value={team2Score}
                            onChange={(e) => setTeam2Score(e.target.value)}
                            className="w-20 px-3 py-2 text-center rounded-xl bg-[#141824] border border-white/20 text-white font-mono text-xl font-black mx-auto"
                          />
                        </div>
                      </div>

                      {/* Game-by-Game Score Matrix (Game 1, Game 2, Game 3...) */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-300 uppercase font-gaming block">
                          Game-by-Game Round Score Matrix
                        </span>

                        <div className="space-y-2">
                          {games.map((game, idx) => (
                            <div
                              key={game.gameNumber || idx}
                              className="p-3 rounded-xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <span className="font-bold text-cyan-400 font-gaming">
                                Game {game.gameNumber || idx + 1}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 truncate max-w-[120px]">
                                  {activeMatch.team1?.teamName}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={game.team1Score || 0}
                                  onChange={(e) => handleGameScoreChange(idx, 'team1Score', e.target.value)}
                                  className="w-14 px-2 py-1 text-center rounded bg-[#141824] border border-white/15 text-white font-mono font-bold"
                                />
                                <span className="text-slate-500 font-bold">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={game.team2Score || 0}
                                  onChange={(e) => handleGameScoreChange(idx, 'team2Score', e.target.value)}
                                  className="w-14 px-2 py-1 text-center rounded bg-[#141824] border border-white/15 text-white font-mono font-bold"
                                />
                                <span className="text-slate-400 truncate max-w-[120px]">
                                  {activeMatch.team2?.teamName}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={handleSaveMatchScore}
                          disabled={saving}
                          className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase font-gaming tracking-wider shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>Save Match Result</span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="md:col-span-2 p-8 text-center text-slate-500">
                      Select a match fixture on the left to enter scores.
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADVANCE WINNERS TO NEXT ROUND */}
          {activeTab === 'advance' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#121624] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-gaming uppercase">
                      Round Progression: {activeRound?.roundName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Completed Matches: {advancingWinners.length} / {currentRoundMatches.length}
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-gaming ${
                    allCurrentRoundMatchesCompleted
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {allCurrentRoundMatchesCompleted ? 'Ready to Advance' : 'Matches in Progress'}
                  </span>
                </div>

                {/* Advancing Winners List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase font-gaming block">
                    Advancing Squads ({advancingWinners.length})
                  </span>

                  {advancingWinners.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {advancingWinners.map((winner, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-black/40 border border-amber-500/20 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Crown className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-xs font-bold text-white font-gaming truncate">
                            {winner.teamName}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No winners determined yet. Enter match scores in the Scores tab.
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {advancingWinners.length === 1 
                      ? 'Single winner remaining — clicking advance will crown the tournament Grand Champion!'
                      : `Advancing will pair the ${advancingWinners.length} winners into the next round.`}
                  </span>

                  <button
                    onClick={handleAdvanceRound}
                    disabled={saving || !allCurrentRoundMatchesCompleted || advancingWinners.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase font-gaming tracking-wider shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    <span>{advancingWinners.length === 1 ? 'Crown Tournament Champions' : 'Generate Next Round'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GENERATE / RESET DRAW */}
          {activeTab === 'draw' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#121624] border border-white/10 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white font-gaming uppercase">
                    Tournament Fixture Draw Generator
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select pairing parameters. If exactly 2 teams are registered (or Direct Series mode), a direct Best-of-N Grand Finals will be generated (Case 1). If 10 or more teams are registered, a multi-round knockout bracket will be generated (Case 2).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Match Format
                    </label>
                    <select
                      value={matchType}
                      onChange={(e) => setMatchType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B0E17] border border-white/15 text-white text-xs"
                    >
                      <option value="1v1">1v1 (Football / FIFA / Duel)</option>
                      <option value="4v4">4v4 (Free Fire Clash Squad / BGMI WOW 4v4)</option>
                      <option value="5v5">5v5 (Valorant / CS2 Tactical)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Series Length (Best-of-N)
                    </label>
                    <select
                      value={seriesLength}
                      onChange={(e) => setSeriesLength(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B0E17] border border-white/15 text-white text-xs"
                    >
                      <option value={1}>Best of 1 (Single Match)</option>
                      <option value={3}>Best of 3 (First to 2 Wins)</option>
                      <option value={5}>Best of 5 (First to 3 Wins)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="shuffle"
                    checked={shuffleTeams}
                    onChange={(e) => setShuffleTeams(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 bg-black/40 border-white/20"
                  />
                  <label htmlFor="shuffle" className="text-xs text-slate-300 cursor-pointer">
                    Randomize squad seeding draw (Shuffle teams before pairing)
                  </label>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end">
                  <button
                    onClick={handleGenerateDraw}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase font-gaming tracking-wider shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                    <span>Generate Match Draw</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
