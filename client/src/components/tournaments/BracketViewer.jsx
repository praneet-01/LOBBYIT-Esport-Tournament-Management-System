import React, { useState } from 'react';
import { 
  Trophy, 
  Swords, 
  Shield, 
  Key, 
  Copy, 
  Check, 
  ChevronRight, 
  Camera, 
  Crown, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Flame,
  LayoutGrid,
  GitBranch,
  Sparkles,
  Medal,
  Tv,
  Gamepad2
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
      <div className="p-8 sm:p-12 text-center bg-[#111318] border border-white/10 rounded-2xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
          <GitBranch className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white uppercase font-gaming">
          Tournament Bracket Generating
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
          The organizer will generate and seed the tournament bracket once squad registrations close.
        </p>
        {isOrganizer && (
          <button
            onClick={onOpenOrganizerManager}
            className="px-5 py-2.5 rounded-xl bg-[#E6002B] hover:bg-[#ff1f4b] text-white font-bold text-xs uppercase font-gaming tracking-wider transition-all shadow-lg shadow-[#E6002B]/20 cursor-pointer active:scale-95"
          >
            Open Bracket Manager
          </button>
        )}
      </div>
    );
  }

  // Check if a single round tournament (e.g. Grand Finals Showdown or Direct Series)
  const isSingleRound = rounds.length === 1;

  // Helper to determine match winner status accurately
  const getMatchWinnerStatus = (match, roundIndex) => {
    const isCompleted = match.status === 'completed' || !!match.winner?.team || !!match.winner?.teamName;
    const isLive = match.status === 'live';
    const t1Wins = match.team1Wins ?? match.team1?.score ?? 0;
    const t2Wins = match.team2Wins ?? match.team2?.score ?? 0;

    const winnerName = match.winner?.teamName || (typeof match.winner === 'string' ? match.winner : '');
    const winnerId = match.winner?.team?._id?.toString() || match.winner?.team?.toString() || match.winner?._id?.toString();
    const champName = champion?.firstPlace?.teamName?.toLowerCase()?.trim();
    const isLastRound = roundIndex === rounds.length - 1;

    const t1Name = match.team1?.teamName?.toLowerCase()?.trim();
    const t2Name = match.team2?.teamName?.toLowerCase()?.trim();

    let isT1Winner = false;
    let isT2Winner = false;

    if (winnerName) {
      if (t1Name && winnerName.toLowerCase().trim() === t1Name) isT1Winner = true;
      if (t2Name && winnerName.toLowerCase().trim() === t2Name) isT2Winner = true;
    }
    if (!isT1Winner && !isT2Winner && winnerId) {
      const matchT1Id = match.team1?.team?._id?.toString() || match.team1?.team?.toString();
      const matchT2Id = match.team2?.team?._id?.toString() || match.team2?.team?.toString();
      if (matchT1Id && matchT1Id === winnerId) isT1Winner = true;
      if (matchT2Id && matchT2Id === winnerId) isT2Winner = true;
    }
    // If completed and in last round, check against champion
    if (!isT1Winner && !isT2Winner && isCompleted && isLastRound && champName) {
      if (t1Name === champName) isT1Winner = true;
      if (t2Name === champName) isT2Winner = true;
    }
    // If completed with scores and no explicit winner flag
    if (!isT1Winner && !isT2Winner && isCompleted && t1Wins !== t2Wins) {
      if (t1Wins > t2Wins) isT1Winner = true;
      if (t2Wins > t1Wins) isT2Winner = true;
    }

    return {
      isCompleted,
      isLive,
      t1Wins,
      t2Wins,
      isT1Winner,
      isT2Winner
    };
  };

  // Helper to render an esports match card
  const renderMatchCard = (match, roundIndex, roundNumber) => {
    const { isCompleted, isLive, t1Wins, t2Wins, isT1Winner, isT2Winner } = getMatchWinnerStatus(match, roundIndex);
    const userInThis = isUserInMatch(match);
    const roomId = match.roomId || match.roomCredentials?.roomId;
    const roomPassword = match.password || match.roomCredentials?.password;

    return (
      <div 
        key={match._id || match.matchNumber} 
        className={`w-full rounded-xl border bg-[#141620] overflow-hidden transition-all text-xs shadow-md ${
          userInThis 
            ? 'border-[#E6002B] ring-1 ring-[#E6002B]/40 shadow-[#E6002B]/10' 
            : isLive
            ? 'border-amber-500/60 ring-1 ring-amber-500/30'
            : isCompleted
            ? 'border-white/10 hover:border-white/25'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        {/* Match Header Bar */}
        <div className="px-3.5 py-2 bg-[#181B28] border-b border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-zinc-300">
              M{match.matchNumber}
            </span>
            {userInThis && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#E6002B]/20 text-[#ff4d6d] border border-[#E6002B]/30 font-gaming">
                YOUR SQUAD
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isCompleted ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-white/10 uppercase tracking-wider font-gaming">
                Final
              </span>
            ) : isLive ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-gaming flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Live
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-zinc-400 border border-white/10 uppercase font-gaming">
                Bo{match.bestOf || tournament.seriesLength || 3}
              </span>
            )}
          </div>
        </div>

        {/* Team 1 Row */}
        <div className={`px-3.5 py-2.5 flex items-center justify-between border-b border-white/5 transition-colors ${
          isT1Winner ? 'bg-emerald-500/10' : ''
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="text-[10px] text-zinc-500 font-mono w-3.5 shrink-0">1</span>
            <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
              {match.team1?.teamLogo ? (
                <img src={match.team1.teamLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                match.team1?.teamName ? match.team1.teamName.charAt(0).toUpperCase() : '?'
              )}
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <span className={`font-bold truncate text-xs ${
                isT1Winner 
                  ? 'text-emerald-400 font-black' 
                  : match.team1?.teamName 
                  ? isCompleted && isT2Winner 
                    ? 'text-zinc-400' 
                    : 'text-white' 
                  : 'text-zinc-500 italic'
              }`}>
                {match.team1?.teamName || 'TBD'}
              </span>
              {isT1Winner && (
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
            </div>
          </div>
          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs shrink-0 ${
            isT1Winner 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
              : 'bg-black/50 text-zinc-300 border border-white/5'
          }`}>
            {t1Wins}
          </span>
        </div>

        {/* Team 2 Row */}
        <div className={`px-3.5 py-2.5 flex items-center justify-between transition-colors ${
          isT2Winner ? 'bg-emerald-500/10' : ''
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="text-[10px] text-zinc-500 font-mono w-3.5 shrink-0">2</span>
            <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
              {match.team2?.teamLogo ? (
                <img src={match.team2.teamLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                match.team2?.teamName ? match.team2.teamName.charAt(0).toUpperCase() : '?'
              )}
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <span className={`font-bold truncate text-xs ${
                isT2Winner 
                  ? 'text-emerald-400 font-black' 
                  : match.team2?.teamName 
                  ? isCompleted && isT1Winner 
                    ? 'text-zinc-400' 
                    : 'text-white' 
                  : 'text-zinc-500 italic'
              }`}>
                {match.team2?.teamName || 'TBD'}
              </span>
              {isT2Winner && (
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
            </div>
          </div>
          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs shrink-0 ${
            isT2Winner 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
              : 'bg-black/50 text-zinc-300 border border-white/5'
          }`}>
            {t2Wins}
          </span>
        </div>

        {/* Room Credentials Footer (if available) */}
        {roomId && (
          <div className="px-3.5 py-1.5 bg-black/50 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 font-mono gap-2">
            <div className="flex items-center gap-3">
              <span>Room: <strong className="text-white">{roomId}</strong></span>
              <span>Pass: <strong className="text-white">{roomPassword || 'None'}</strong></span>
            </div>
            <button
              onClick={() => copyToClipboard(`Room: ${roomId} Pass: ${roomPassword || ''}`, `room-${match._id}`)}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              title="Copy Room Credentials"
            >
              {copiedKey === `room-${match._id}` ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Proof Action for user squad */}
        {userInThis && !isCompleted && (
          <div className="px-3.5 py-2 bg-[#12141c] border-t border-white/5 flex items-center justify-end">
            <button
              onClick={() => handleOpenProofModal(match, roundNumber)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" /> Submit Proof
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Champion Showcase Banner (Esports Trophy Podium Style) */}
      {champion?.firstPlace?.teamName && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#141622] to-amber-950/20 border border-amber-500/40 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Crown className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 font-gaming">
                  🏆 Tournament Champion
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">Bracket Concluded</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white font-gaming uppercase tracking-wide">
                {champion.firstPlace.teamName}
              </h2>
              {champion.secondPlace?.teamName && (
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Medal className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Runner-up:</span>
                  <strong className="text-zinc-200 font-bold">{champion.secondPlace.teamName}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <div className="px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-center">
              <span className="text-[9px] uppercase font-bold text-zinc-400 block font-gaming tracking-wider">Format</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 uppercase font-gaming">
                {tournament.matchType || '1v1'} Bo{tournament.seriesLength || 1}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Controls & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-[#12141A] border border-white/10">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="inline-flex items-center bg-black/50 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-zinc-100 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Bracket Tree</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-zinc-100 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Match List</span>
            </button>
          </div>

          {/* Series badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] sm:text-xs text-zinc-300 font-gaming">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Single Elimination • Bo{tournament.seriesLength || 1} Series
          </span>
        </div>

        {isOrganizer && (
          <button
            onClick={onOpenOrganizerManager}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#E6002B] hover:bg-[#ff1f4b] text-white font-bold text-xs uppercase font-gaming tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#E6002B]/20 active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>Manage Bracket & Scores</span>
          </button>
        )}
      </div>

      {/* 3. BRACKET VIEW CONTENT */}
      {viewMode === 'tree' ? (
        isSingleRound ? (
          /* SPECIAL CASE: Single Round / Direct Finals Showdown */
          <div className="w-full max-w-xl mx-auto space-y-4 pt-2">
            {rounds.map((round, rIdx) => (
              <div key={round.roundNumber || rIdx} className="space-y-3">
                {/* Round Header */}
                <div className="p-3.5 rounded-xl bg-[#141620] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white uppercase font-gaming tracking-wider">
                        {round.roundName}
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {round.matches?.length || 0} Fixture{round.matches?.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase font-gaming">
                    Finals
                  </span>
                </div>

                {/* Match Cards */}
                <div className="space-y-4">
                  {round.matches?.map((match) => renderMatchCard(match, rIdx, round.roundNumber))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* MULTI-ROUND BRACKET TREE */
          <div className="space-y-2">
            {/* Mobile swipe hint */}
            <div className="sm:hidden flex items-center gap-1.5 px-1 text-[11px] text-zinc-400">
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Scroll horizontally to view all tournament rounds</span>
            </div>

            <div className="overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-zinc-700">
              <div className="flex items-stretch gap-6 px-1">
                {rounds.map((round, rIdx) => {
                  const isLastRound = rIdx === rounds.length - 1;

                  return (
                    <div 
                      key={round.roundNumber || rIdx} 
                      className="w-[280px] sm:w-[300px] shrink-0 flex flex-col"
                    >
                      {/* Round Header */}
                      <div className="mb-3.5 pb-2 border-b border-white/10 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase font-gaming tracking-wider">
                            {round.roundName}
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {round.matches?.length || 0} {round.matches?.length === 1 ? 'Match' : 'Matches'}
                          </span>
                        </div>
                        {isLastRound && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase font-gaming">
                            Finals
                          </span>
                        )}
                      </div>

                      {/* Matches in Round */}
                      <div className="flex flex-col justify-around flex-grow gap-4">
                        {round.matches?.map((match) => renderMatchCard(match, rIdx, round.roundNumber))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      ) : (
        /* 4. DETAILED MATCH LIST VIEW */
        <div className="space-y-6">
          {rounds.map((round, rIdx) => (
            <div key={round.roundNumber || rIdx} className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-gaming tracking-wider flex items-center gap-2">
                  <Swords className="w-4 h-4 text-cyan-400" />
                  <span>{round.roundName}</span>
                </h4>
                <span className="text-xs text-zinc-400 font-mono">
                  {round.matches?.length || 0} Match{round.matches?.length === 1 ? '' : 'es'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {round.matches?.map((match) => renderMatchCard(match, rIdx, round.roundNumber))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proof Submission Modal */}
      {proofModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12141A] border border-white/10 rounded-2xl p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white font-gaming uppercase flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Submit Match Screenshot Proof</span>
              </h3>
              <button 
                onClick={() => setProofModalMatch(null)}
                className="text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
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
                  className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {proofError && <p className="text-xs text-red-400">{proofError}</p>}
              {proofSuccess && <p className="text-xs text-emerald-400">{proofSuccess}</p>}

              <button
                type="submit"
                disabled={submittingProof}
                className="w-full py-2.5 rounded-xl bg-[#E6002B] hover:bg-[#ff1f4b] text-white font-bold text-xs uppercase font-gaming transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-md shadow-[#E6002B]/20"
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
