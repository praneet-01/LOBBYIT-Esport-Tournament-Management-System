import React, { useState } from 'react';
import { 
  Trophy, 
  Swords, 
  Shield, 
  Key, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Crown, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Flame,
  LayoutGrid,
  GitBranch
} from 'lucide-react';
import api from '../../services/api';

export default function BracketViewer({ 
  tournament, 
  bracket = [], 
  champion, 
  isOrganizer, 
  userTeam,
  onOpenOrganizerManager,
  onRefresh
}) {
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'list'
  const [copiedKey, setCopiedKey] = useState(null);
  const [proofModalMatch, setProofModalMatch] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSuccess, setProofSuccess] = useState('');
  const [proofError, setProofError] = useState('');

  const rounds = bracket && bracket.length > 0 ? bracket : [];

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenProofModal = (match, roundNumber) => {
    setProofModalMatch({ ...match, roundNumber });
    setProofUrl('');
    setProofSuccess('');
    setProofError('');
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!proofUrl) {
      setProofError('Please enter screenshot proof URL');
      return;
    }
    setSubmittingProof(true);
    setProofError('');
    try {
      await api.post(
        `/tournaments/${tournament._id}/bracket/round/${proofModalMatch.roundNumber}/match/${proofModalMatch._id}/proof`,
        { screenshotUrl: proofUrl }
      );
      setProofSuccess('Screenshot proof uploaded successfully!');
      setTimeout(() => {
        setProofModalMatch(null);
        if (onRefresh) onRefresh();
      }, 1500);
    } catch (err) {
      setProofError(err.response?.data?.message || 'Failed to submit match proof');
    } finally {
      setSubmittingProof(false);
    }
  };

  const isUserInMatch = (match) => {
    if (!userTeam) return false;
    const userTeamId = userTeam._id?.toString() || userTeam.id?.toString();
    const t1Id = match.team1?.team?._id?.toString() || match.team1?.team?.toString();
    const t2Id = match.team2?.team?._id?.toString() || match.team2?.team?.toString();
    return userTeamId === t1Id || userTeamId === t2Id;
  };

  if (!rounds || rounds.length === 0) {
    return (
      <div className="p-12 text-center bg-[#111318] border border-white/10 rounded-2xl space-y-4">
        <GitBranch className="w-12 h-12 text-zinc-500 mx-auto" />
        <h3 className="text-base font-bold text-white uppercase font-gaming">
          Tournament Bracket Generating
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          The organizer will generate and seed the tournament bracket once squad registrations close.
        </p>
        {isOrganizer && (
          <button
            onClick={onOpenOrganizerManager}
            className="px-5 py-2.5 rounded-xl bg-[#E6002B] hover:bg-[#ff1f4b] text-white font-bold text-xs uppercase font-gaming tracking-wider transition-colors cursor-pointer"
          >
            Open Bracket Manager
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Champion Showcase Banner (Battlefy Style, Zero Glow) */}
      {champion?.firstPlace?.teamName && (
        <div className="rounded-2xl bg-[#14161E] border border-amber-500/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Tournament Champion
                </span>
                <span className="text-[11px] text-zinc-400">Bracket Concluded</span>
              </div>
              <h2 className="text-2xl font-black text-white font-gaming uppercase tracking-wide mt-1">
                {champion.firstPlace.teamName}
              </h2>
              {champion.secondPlace?.teamName && (
                <p className="text-xs text-zinc-400">
                  Runner-up: <strong className="text-zinc-200">{champion.secondPlace.teamName}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block font-gaming">Format</span>
              <span className="text-xs font-bold text-amber-400 uppercase font-gaming">
                {tournament.matchType || '4v4'} Bo{tournament.seriesLength || 3}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Controls & View Toggle (Battlefy / Bracketly Inspired) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#12141A] border border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-zinc-100 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Bracket Tree</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-zinc-100 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Match List</span>
            </button>
          </div>

          <span className="text-xs text-zinc-400 font-gaming">
            Single Elimination • Bo{tournament.seriesLength || 3} Series
          </span>
        </div>

        {isOrganizer && (
          <button
            onClick={onOpenOrganizerManager}
            className="px-4 py-2 rounded-lg bg-[#E6002B] hover:bg-[#ff1f4b] text-white font-bold text-xs uppercase font-gaming tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Trophy className="w-4 h-4" />
            <span>Manage Bracket & Scores</span>
          </button>
        )}
      </div>

      {/* 3. VISUAL BRACKET TREE VIEW (Battlefy / Bracketly) */}
      {viewMode === 'tree' ? (
        <div className="overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-zinc-700">
          <div className="flex items-stretch gap-8 min-w-[760px] px-2">
            {rounds.map((round, rIdx) => {
              const isLastRound = rIdx === rounds.length - 1;

              return (
                <div key={round.roundNumber || rIdx} className="flex-1 flex flex-col">
                  {/* Round Header */}
                  <div className="mb-4 pb-2 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase font-gaming tracking-wider">
                        {round.roundName}
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {round.matches?.length || 0} Matches
                      </span>
                    </div>
                    {isLastRound && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-gaming">
                        Finals
                      </span>
                    )}
                  </div>

                  {/* Matches Column */}
                  <div className="flex flex-col justify-around flex-grow gap-6">
                    {round.matches?.map((match) => {
                      const isCompleted = match.status === 'completed' || !!match.winner?.team;
                      const isLive = match.status === 'live';
                      const userInThis = isUserInMatch(match);

                      const t1Wins = match.team1Wins || 0;
                      const t2Wins = match.team2Wins || 0;
                      const isT1Winner = match.winner?.team && (match.winner.team === match.team1?.team || match.winner.team?._id === match.team1?.team?._id || match.winner.teamName === match.team1?.teamName);
                      const isT2Winner = match.winner?.team && (match.winner.team === match.team2?.team || match.winner.team?._id === match.team2?.team?._id || match.winner.teamName === match.team2?.teamName);

                      return (
                        <div key={match._id} className="relative group">
                          {/* Match Box */}
                          <div className={`w-full rounded-xl border bg-[#14161F] overflow-hidden transition-all text-xs ${
                            userInThis 
                              ? 'border-[#E6002B] ring-1 ring-[#E6002B]/40' 
                              : isLive
                              ? 'border-amber-500/50'
                              : 'border-white/10 hover:border-white/20'
                          }`}>
                            {/* Match Header Bar */}
                            <div className="px-3 py-1.5 bg-[#181B26] border-b border-white/5 flex items-center justify-between text-[11px]">
                              <span className="text-zinc-400 font-mono font-semibold">
                                M{match.matchNumber}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isCompleted ? (
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Final</span>
                                ) : isLive ? (
                                  <span className="text-[10px] font-bold text-amber-400 uppercase animate-pulse">● Live</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Bo{match.bestOf || 3}</span>
                                )}
                              </div>
                            </div>

                            {/* Team 1 Row */}
                            <div className={`px-3 py-2 flex items-center justify-between border-b border-white/5 transition-colors ${
                              isT1Winner ? 'bg-emerald-500/10' : ''
                            }`}>
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="text-[10px] text-zinc-500 font-mono">1</span>
                                <span className={`font-bold truncate ${isT1Winner ? 'text-emerald-400 font-black' : match.team1?.teamName ? 'text-white' : 'text-zinc-500 italic'}`}>
                                  {match.team1?.teamName || 'TBD'}
                                </span>
                              </div>
                              <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                isT1Winner ? 'bg-emerald-500/20 text-emerald-300' : 'bg-black/40 text-zinc-300'
                              }`}>
                                {t1Wins}
                              </span>
                            </div>

                            {/* Team 2 Row */}
                            <div className={`px-3 py-2 flex items-center justify-between transition-colors ${
                              isT2Winner ? 'bg-emerald-500/10' : ''
                            }`}>
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="text-[10px] text-zinc-500 font-mono">2</span>
                                <span className={`font-bold truncate ${isT2Winner ? 'text-emerald-400 font-black' : match.team2?.teamName ? 'text-white' : 'text-zinc-500 italic'}`}>
                                  {match.team2?.teamName || 'TBD'}
                                </span>
                              </div>
                              <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                isT2Winner ? 'bg-emerald-500/20 text-emerald-300' : 'bg-black/40 text-zinc-300'
                              }`}>
                                {t2Wins}
                              </span>
                            </div>

                            {/* Room Credentials Footer (if available) */}
                            {match.roomCredentials?.roomId && (
                              <div className="px-3 py-1.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                                <span>Room: <strong className="text-white">{match.roomCredentials.roomId}</strong></span>
                                <span>Pass: <strong className="text-white">{match.roomCredentials.password || 'None'}</strong></span>
                              </div>
                            )}

                            {/* Proof Action for user squad */}
                            {userInThis && !isCompleted && (
                              <div className="px-3 py-1.5 bg-zinc-900 border-t border-white/5 flex items-center justify-end">
                                <button
                                  onClick={() => handleOpenProofModal(match, round.roundNumber)}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Camera className="w-3 h-3" /> Submit Proof
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 4. DETAILED MATCH LIST VIEW */
        <div className="space-y-4">
          {rounds.map((round) => (
            <div key={round.roundNumber} className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase font-gaming tracking-wider px-1">
                {round.roundName}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {round.matches?.map((match) => (
                  <div key={match._id} className="p-4 rounded-xl bg-[#14161F] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-bold text-white font-gaming">Match {match.matchNumber}</span>
                      <span className="font-mono">{match.status || 'Scheduled'}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs p-2 rounded bg-black/30">
                        <span className="font-bold text-white">{match.team1?.teamName || 'TBD'}</span>
                        <span className="font-mono font-bold text-zinc-200">{match.team1Wins || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs p-2 rounded bg-black/30">
                        <span className="font-bold text-white">{match.team2?.teamName || 'TBD'}</span>
                        <span className="font-mono font-bold text-zinc-200">{match.team2Wins || 0}</span>
                      </div>
                    </div>

                    {match.winner?.teamName && (
                      <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Winner: {match.winner.teamName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proof Submission Modal */}
      {proofModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12141A] border border-white/10 rounded-2xl p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white font-gaming uppercase">
                Submit Match Screenshot Proof
              </h3>
              <button 
                onClick={() => setProofModalMatch(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Screenshot Proof URL</label>
                <input
                  type="url"
                  placeholder="https://imgur.com/screenshot.png"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#E6002B]"
                  required
                />
              </div>

              {proofError && <p className="text-xs text-red-400">{proofError}</p>}
              {proofSuccess && <p className="text-xs text-emerald-400">{proofSuccess}</p>}

              <button
                type="submit"
                disabled={submittingProof}
                className="w-full py-2.5 rounded-xl bg-[#E6002B] hover:bg-[#ff1f4b] text-white font-bold text-xs uppercase font-gaming transition-colors cursor-pointer disabled:opacity-50"
              >
                {submittingProof ? 'Uploading...' : 'Submit Match Proof'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
