import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  X, 
  Users, 
  Trophy, 
  Shield, 
  Gamepad2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Plus, 
  Edit3, 
  FileText, 
  RefreshCw,
  Crown,
  Camera,
  ExternalLink,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

const GAME_MAPS = {
  bgmi: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
  'free-fire': ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'],
  'free fire': ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine']
};

export default function BRGroupScoreManagerModal({ tournament, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'scorecard' | 'progression' | 'champions'
  const [stagesData, setStagesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-group config
  const [stageNameInput, setStageNameInput] = useState('Round 1 - Qualifiers');
  const [isFinalStageInput, setIsFinalStageInput] = useState(false);
  const [matchesPerGroupInput, setMatchesPerGroupInput] = useState(2);
  const [qualifyCountInput, setQualifyCountInput] = useState(8);
  const [shuffleInput, setShuffleInput] = useState(true);

  // Progression config
  const [nextStageNameInput, setNextStageNameInput] = useState('Grand Finals');
  const [nextStageMatchesInput, setNextStageMatchesInput] = useState(2);
  const [nextStageIsFinalInput, setNextStageIsFinalInput] = useState(true);

  // Selected Stage, Group, Match for Scorecard
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);

  // Score Matrix State: array of 16 rows [{ slotNumber, teamId, teamName, teamLogo, rank, kills, proofStatus, screenshotProof }]
  const [scoresState, setScoresState] = useState([]);

  // Match edit state
  const [mapInput, setMapInput] = useState('Erangel');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [matchStatusInput, setMatchStatusInput] = useState('upcoming');
  const [newMatchTitle, setNewMatchTitle] = useState('');

  // Proof inspection preview
  const [previewProofTarget, setPreviewProofTarget] = useState(null);

  // Prize Payouts for Podium
  const [payout1stAmount, setPayout1stAmount] = useState(25000);
  const [payout1stUpi, setPayout1stUpi] = useState('champion@upi');
  const [payout2ndAmount, setPayout2ndAmount] = useState(15000);
  const [payout2ndUpi, setPayout2ndUpi] = useState('runnerup@upi');
  const [payout3rdAmount, setPayout3rdAmount] = useState(10000);
  const [payout3rdUpi, setPayout3rdUpi] = useState('thirdplace@upi');

  // Fetch full tournament stages & groups
  const fetchStages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tournaments/${tournament._id}/stages`);
      setStagesData(res.data.stages || []);
      if (res.data.stages && res.data.stages.length > 0) {
        initScoresForSelection(res.data.stages, selectedStageIndex, selectedGroupIndex, selectedMatchIndex);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tournament stage details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, [tournament._id]);

  const initScoresForSelection = (stages, sIdx, gIdx, mIdx) => {
    const stage = stages[sIdx];
    if (!stage) return;
    const group = stage.groups?.[gIdx];
    if (!group) return;
    const match = group.matches?.[mIdx];

    setMapInput(match?.map || 'Erangel');
    setRoomIdInput(match?.roomId || '');
    setPasswordInput(match?.password || '');
    setMatchStatusInput(match?.status || 'upcoming');

    // Build 16 slots matrix
    const matrix = [];
    for (let slot = 1; slot <= 16; slot++) {
      const teamInSlot = group.teams?.find((t) => t.slotNumber === slot);
      const existingResult = match?.results?.find((r) => r.slotNumber === slot);

      const hasRank = existingResult?.rank && Number(existingResult.rank) > 0;
      matrix.push({
        slotNumber: slot,
        teamId: existingResult?.team || teamInSlot?.team,
        teamName: existingResult?.teamName || teamInSlot?.teamName || (teamInSlot ? `Team Slot ${slot}` : 'Unassigned Slot'),
        teamLogo: existingResult?.teamLogo || teamInSlot?.teamLogo || '',
        rank: hasRank ? existingResult.rank : '',
        kills: existingResult?.kills !== undefined && existingResult?.kills !== null && existingResult?.kills !== 0 ? existingResult.kills : (hasRank ? 0 : ''),
        proofStatus: existingResult?.proofStatus || 'none',
        screenshotProof: existingResult?.screenshotProof || '',
        submittedRank: existingResult?.submittedRank,
        submittedKills: existingResult?.submittedKills
      });
    }
    setScoresState(matrix);
  };

  // Switch selection in scorecard
  const handleSelectionChange = (sIdx, gIdx, mIdx) => {
    setSelectedStageIndex(sIdx);
    setSelectedGroupIndex(gIdx);
    setSelectedMatchIndex(mIdx);
    initScoresForSelection(stagesData, sIdx, gIdx, mIdx);
  };

  // Auto-Group Teams
  const handleAutoGroup = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/tournaments/${tournament._id}/stages/auto-group`, {
        stageName: stageNameInput,
        qualifyCountPerGroup: isFinalStageInput ? 0 : Number(qualifyCountInput),
        matchesPerGroup: Number(matchesPerGroupInput),
        shuffle: shuffleInput,
        isFinalStage: isFinalStageInput
      });
      setSuccessMsg(res.data.message);
      await fetchStages();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to auto-group teams');
    } finally {
      setSaving(false);
    }
  };

  // Update Score field
  const handleScoreChange = (slotNumber, field, value) => {
    setScoresState((prev) =>
      prev.map((row) => {
        if (row.slotNumber === slotNumber) {
          return {
            ...row,
            [field]: value === '' ? '' : Math.max(0, parseInt(value, 10) || 0)
          };
        }
        return row;
      })
    );
  };

  // Calculate live placement points
  const getPlacementPoints = (rank) => {
    if (!rank || Number(rank) <= 0) return 0;
    const table = { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 };
    return table[Number(rank)] || 0;
  };

  // Save Scorecard Matrix
  const handleSaveScorecard = async () => {
    const stage = stagesData[selectedStageIndex];
    const group = stage?.groups?.[selectedGroupIndex];
    const match = group?.matches?.[selectedMatchIndex];

    if (!stage || !group || !match) {
      setError('Please select an active stage, group, and match.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      // 1. Save match credentials first if changed
      await api.put(`/tournaments/${tournament._id}/stages/${stage._id}/groups/${group._id}/matches/${match._id}/credentials`, {
        map: mapInput,
        roomId: roomIdInput,
        password: passwordInput,
        status: matchStatusInput
      });

      // 2. Save scores matrix
      const res = await api.put(`/tournaments/${tournament._id}/stages/${stage._id}/groups/${group._id}/matches/${match._id}/score-matrix`, {
        scores: scoresState,
        markCompleted: matchStatusInput === 'completed' || true
      });

      setSuccessMsg('Match scores calculated & saved! Leaderboard updated.');
      await fetchStages();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save score matrix');
    } finally {
      setSaving(false);
    }
  };

  // Add Match to Group
  const handleAddMatch = async () => {
    const stage = stagesData[selectedStageIndex];
    const group = stage?.groups?.[selectedGroupIndex];
    if (!stage || !group) return;

    setSaving(true);
    try {
      await api.post(`/tournaments/${tournament._id}/stages/${stage._id}/groups/${group._id}/matches`, {
        map: mapInput || 'Miramar',
        title: newMatchTitle || `${group.name} - Match ${(group.matches?.length || 0) + 1} (${mapInput})`
      });
      setSuccessMsg('New match round added successfully!');
      setNewMatchTitle('');
      await fetchStages();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add match');
    } finally {
      setSaving(false);
    }
  };

  // Stage Progression: Promote top teams to Grand Finals
  const handlePromoteTeams = async () => {
    const stage = stagesData[selectedStageIndex];
    if (!stage) return;

    if (!window.confirm(`Are you sure you want to qualify Top ${stage.qualifyCountPerGroup || 8} teams from each group and generate ${nextStageNameInput}?`)) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/tournaments/${tournament._id}/stages/${stage._id}/promote`, {
        nextStageName: nextStageNameInput,
        qualifyCount: stage.qualifyCountPerGroup || 8,
        matchesCount: Number(nextStageMatchesInput) || 2,
        isFinalStage: nextStageIsFinalInput
      });
      setSuccessMsg(res.data.message);
      await fetchStages();
      setActiveTab('progression');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote teams');
    } finally {
      setSaving(false);
    }
  };

  // Crown Champions & Disburse Prize Payouts
  const handleCrownChampions = async (first, second, third) => {
    if (!first) {
      setError('Please select the 1st place champion team');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // 1. Record Prize Payout Distribution
      const distribution = [
        {
          place: 1,
          title: 'Champion',
          team: first.teamId,
          teamName: first.teamName,
          amount: Number(payout1stAmount) || 0,
          upiId: payout1stUpi || 'champion@upi'
        }
      ];
      if (second) {
        distribution.push({
          place: 2,
          title: '1st Runner-Up',
          team: second.teamId,
          teamName: second.teamName,
          amount: Number(payout2ndAmount) || 0,
          upiId: payout2ndUpi || 'runnerup@upi'
        });
      }
      if (third) {
        distribution.push({
          place: 3,
          title: '2nd Runner-Up',
          team: third.teamId,
          teamName: third.teamName,
          amount: Number(payout3rdAmount) || 0,
          upiId: payout3rdUpi || 'thirdplace@upi'
        });
      }

      await api.post(`/tournaments/${tournament._id}/payout`, { distribution });

      // 2. Crown official champions
      const res = await api.post(`/tournaments/${tournament._id}/crown-champions`, {
        firstPlace: { teamId: first.teamId, teamName: first.teamName, teamLogo: first.teamLogo },
        secondPlace: second ? { teamId: second.teamId, teamName: second.teamName, teamLogo: second.teamLogo } : null,
        thirdPlace: third ? { teamId: third.teamId, teamName: third.teamName, teamLogo: third.teamLogo } : null
      });

      setSuccessMsg(`🏆 Tournament Completed! Champions crowned & prize payouts of ₹${distribution.reduce((s, i) => s + i.amount, 0).toLocaleString()} recorded & disbursed.`);
      await fetchStages();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to crown champions & disburse payouts');
    } finally {
      setSaving(false);
    }
  };

  const currentStage = stagesData[selectedStageIndex];
  const currentGroup = currentStage?.groups?.[selectedGroupIndex];
  const currentMatch = currentGroup?.matches?.[selectedMatchIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B0E17] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto text-slate-100 font-sans">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#121826]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6002B]/10 border border-[#E6002B]/30 flex items-center justify-center text-[#E6002B]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-gaming tracking-wide uppercase flex items-center gap-2">
                Battle Royale Operations Engine
              </h2>
              <p className="text-xs text-slate-400">
                16-Team Slots • Group Stage (A, B...) • Fast Score Matrix • Grand Finals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center border-b border-white/10 bg-[#0E131F] px-4 sm:px-6 gap-2 text-xs font-gaming uppercase tracking-wider overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('groups'); setError(''); setSuccessMsg(''); }}
            className={`py-3 px-3.5 font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'groups'
                ? 'border-[#E6002B] text-white bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" /> 1. Stage & Groups Setup
          </button>
          <button
            onClick={() => { setActiveTab('scorecard'); setError(''); setSuccessMsg(''); }}
            className={`py-3 px-3.5 font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'scorecard'
                ? 'border-[#E6002B] text-white bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" /> 2. Fast Match Scorecard
          </button>
          <button
            onClick={() => { setActiveTab('progression'); setError(''); setSuccessMsg(''); }}
            className={`py-3 px-3.5 font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'progression'
                ? 'border-[#E6002B] text-white bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-400" /> 3. Stage Progression
          </button>
          <button
            onClick={() => { setActiveTab('champions'); setError(''); setSuccessMsg(''); }}
            className={`py-3 px-3.5 font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'champions'
                ? 'border-[#E6002B] text-white bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Crown className="w-4 h-4 text-yellow-400" /> 4. Crown Champions
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: STAGE & RANDOM GROUP ALLOCATION */}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              
              {/* Stage & Group Setup Card */}
              <div className="p-6 rounded-2xl bg-[#121826] border border-white/10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-black text-white uppercase font-gaming flex items-center gap-2">
                      <Flame className="w-5 h-5 text-[#E6002B]" /> 1. Stage & Random Slot Assignment
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure stage parameters and randomly shuffle all accepted teams into 16-team groups.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold font-gaming">
                    <Users className="w-4 h-4" />
                    <span>{tournament.registeredTeamsCount || 32} Accepted Teams Registered</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Stage Name</label>
                    <input
                      type="text"
                      value={stageNameInput}
                      onChange={(e) => setStageNameInput(e.target.value)}
                      placeholder="e.g. Round 1 - Qualifiers"
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Stage Format</label>
                    <select
                      value={isFinalStageInput ? 'final' : 'qualifier'}
                      onChange={(e) => setIsFinalStageInput(e.target.value === 'final')}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B]"
                    >
                      <option value="qualifier">Qualifiers (Top Teams Advance)</option>
                      <option value="final">Grand Finals (Crowns Winner & Runner-Ups)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Matches per Group</label>
                    <select
                      value={matchesPerGroupInput}
                      onChange={(e) => setMatchesPerGroupInput(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B]"
                    >
                      <option value={1}>1 Match (Erangel)</option>
                      <option value={2}>2 Matches (Erangel + Miramar)</option>
                      <option value={3}>3 Matches (Erangel + Miramar + Sanhok)</option>
                      <option value={4}>4 Matches (Rotation)</option>
                      <option value={6}>6 Matches (Circuit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                      {isFinalStageInput ? 'Final Stage' : 'Top Teams Qualify per Group'}
                    </label>
                    {isFinalStageInput ? (
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-yellow-400 font-bold">
                        🏆 Winner & Runner-Ups
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={qualifyCountInput}
                        onChange={(e) => setQualifyCountInput(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B]"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={shuffleInput}
                      onChange={(e) => setShuffleInput(e.target.checked)}
                      className="w-4 h-4 accent-[#E6002B] rounded"
                    />
                    <span>🎲 Randomly shuffle teams across groups & slots (Fair Random Draw)</span>
                  </label>

                  <button
                    onClick={handleAutoGroup}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-[#E6002B] hover:bg-[#C90022] text-white font-black text-xs uppercase font-gaming tracking-wider transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#E6002B]/30"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                    Generate Groups & Randomize Slots
                  </button>
                </div>
              </div>

              {/* Active Groups Overview */}
              {stagesData.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-black/30 space-y-2">
                  <Users className="w-10 h-10 text-slate-500 mx-auto mb-1 opacity-60" />
                  <p className="text-sm font-bold text-white">No Groups Formed Yet</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Click <strong>"Generate Groups & Randomize Slots"</strong> above to divide the registered teams into official groups of 16 and assign Slots 1 to 16.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stagesData.map((stage, sIdx) => {
                    const isFinal = stage.isFinalStage || stage.name?.toLowerCase().includes('final');
                    return (
                      <div key={stage._id || sIdx} className="bg-[#10141E] border border-white/10 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-3 h-3 rounded-full ${isFinal ? 'bg-yellow-400' : 'bg-cyan-400'}`}></span>
                            <h4 className="text-sm font-black text-white uppercase font-gaming tracking-wide">
                              {stage.name}
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              ({stage.groups?.length || 0} Groups • {stage.groups?.[0]?.matches?.length || 0} Matches Scheduled)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isFinal ? (
                              <span className="text-[10px] text-yellow-400 font-bold bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-500/20 font-gaming">
                                🏆 GRAND FINALS (PODIUM WINNERS)
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-gaming">
                                Top {stage.qualifyCountPerGroup || 8} Teams Qualify to Next Round
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Groups Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {stage.groups?.map((group, gIdx) => (
                            <div key={group._id || gIdx} className="bg-[#141A28] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <h5 className="font-gaming font-black text-white text-sm uppercase">
                                  {group.name}
                                </h5>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {group.teams?.length || 0} Teams Assigned • {group.matches?.length || 0} Matches
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedStageIndex(sIdx);
                                  setSelectedGroupIndex(gIdx);
                                  setSelectedMatchIndex(0);
                                  setActiveTab('scorecard');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#E6002B] text-white text-xs font-bold font-gaming uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                Enter Scores <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center justify-between">
                          <span>
                            ℹ️ <strong>Slots & Room IDs:</strong> Full 16-slot rosters and custom room credentials are automatically accessible to registered teams on the main tournament page under the <strong>"Slots 1–16 & Room Credentials"</strong> tab.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FAST MATCH SCORECARD */}
          {activeTab === 'scorecard' && (
            <div className="space-y-5">
              
              {/* Selector Bar */}
              <div className="p-4 rounded-xl bg-[#121826] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Stage</label>
                    <select
                      value={selectedStageIndex}
                      onChange={(e) => handleSelectionChange(Number(e.target.value), 0, 0)}
                      className="bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {stagesData.map((s, idx) => (
                        <option key={s._id || idx} value={idx}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Group</label>
                    <select
                      value={selectedGroupIndex}
                      onChange={(e) => handleSelectionChange(selectedStageIndex, Number(e.target.value), 0)}
                      className="bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {currentStage?.groups?.map((g, idx) => (
                        <option key={g._id || idx} value={idx}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Match</label>
                    <select
                      value={selectedMatchIndex}
                      onChange={(e) => handleSelectionChange(selectedStageIndex, selectedGroupIndex, Number(e.target.value))}
                      className="bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {currentGroup?.matches?.map((m, idx) => (
                        <option key={m._id || idx} value={idx}>
                          Match {m.matchNumber} ({m.map}) {m.status === 'completed' ? '✓' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddMatch}
                    disabled={saving}
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase font-gaming transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" /> Add Next Match Round
                  </button>
                </div>
              </div>

              {/* Match Credentials / Map Config Bar */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Map</label>
                  <input
                    type="text"
                    value={mapInput}
                    onChange={(e) => setMapInput(e.target.value)}
                    placeholder="e.g. Erangel"
                    className="mt-1 w-full bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Room ID</label>
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="e.g. 849204"
                    className="mt-1 w-full bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                  <input
                    type="text"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="e.g. 1234"
                    className="mt-1 w-full bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Match Status</label>
                  <select
                    value={matchStatusInput}
                    onChange={(e) => setMatchStatusInput(e.target.value)}
                    className="mt-1 w-full bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live (Credentials Active)</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* 16-Row Fast Score Matrix */}
              <div className="rounded-xl border border-white/10 overflow-hidden bg-[#121826]">
                <div className="px-4 py-3 bg-[#0E131F] border-b border-white/10 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-black text-white uppercase font-gaming">16-Team Result Entry Grid</span>
                    <span className="text-slate-400 ml-2">
                      (BGIS 10-Point Scoring: #1 = 10pts, #2 = 6pts, #3 = 5pts... + 1 pt per kill)
                    </span>
                  </div>
                  <button
                    onClick={handleSaveScorecard}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase font-gaming tracking-wide flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#E6002B]/20"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Save & Update Standings
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/60 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">Slot</th>
                        <th className="py-2.5 px-3">Team</th>
                        <th className="py-2.5 px-3 text-center w-24">Rank (1-16)</th>
                        <th className="py-2.5 px-3 text-center w-24">Finishes / Kills</th>
                        <th className="py-2.5 px-3 text-center">Place Pts</th>
                        <th className="py-2.5 px-3 text-center">Kill Pts</th>
                        <th className="py-2.5 px-3 text-center font-black text-white">Total Pts</th>
                        <th className="py-2.5 px-3 text-center">Proof Screenshot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {scoresState.map((row) => {
                        const placePts = getPlacementPoints(row.rank);
                        const killPts = (row.kills || 0) * 1;
                        const total = placePts + killPts;
                        const isWWCD = Number(row.rank) === 1;

                        return (
                          <tr key={row.slotNumber} className={`hover:bg-white/5 transition-colors ${isWWCD ? 'bg-amber-500/10' : ''}`}>
                            <td className="py-2 px-3 font-bold text-slate-400">
                              #{row.slotNumber}
                            </td>
                            <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                              {row.teamName}
                              {isWWCD && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-gaming text-[9px] font-black border border-amber-500/30">
                                  🍗 WWCD
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="1"
                                max="16"
                                placeholder="—"
                                value={row.rank}
                                onChange={(e) => handleScoreChange(row.slotNumber, 'rank', e.target.value)}
                                className="w-16 bg-black/80 border border-white/20 rounded px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-[#E6002B] placeholder:text-slate-600"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={row.kills}
                                onChange={(e) => handleScoreChange(row.slotNumber, 'kills', e.target.value)}
                                className="w-16 bg-black/80 border border-white/20 rounded px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-[#E6002B] placeholder:text-slate-600"
                              />
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-300">
                              {placePts}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-300">
                              {killPts}
                            </td>
                            <td className="py-2 px-3 text-center font-black text-amber-400 text-sm">
                              {total}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {row.screenshotProof ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewProofTarget(row)}
                                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 transition-colors cursor-pointer"
                                      title="Inspect submitted screenshot"
                                    >
                                      <Camera className="w-3 h-3" /> View Proof
                                    </button>

                                    {row.submittedRank ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleScoreChange(row.slotNumber, 'rank', row.submittedRank);
                                          handleScoreChange(row.slotNumber, 'kills', row.submittedKills || 0);
                                        }}
                                        className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/15 hover:bg-emerald-500/25 px-1.5 py-0.5 rounded border border-emerald-500/30 transition-colors cursor-pointer"
                                        title="Auto-fill claimed rank & kills"
                                      >
                                        <Check className="w-2.5 h-2.5" /> Apply
                                      </button>
                                    ) : null}
                                  </div>
                                  {row.submittedRank ? (
                                    <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                                      Claim: #{row.submittedRank} • {row.submittedKills || 0}k
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-[10px] italic">No proof</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAGE PROGRESSION & FINALS */}
          {activeTab === 'progression' && (
            <div className="space-y-6">
              {(() => {
                const activeStg = stagesData[selectedStageIndex] || stagesData[stagesData.length - 1];
                const isCurrentStageFinal = activeStg?.isFinalStage || activeStg?.name?.toLowerCase().includes('final');

                if (isCurrentStageFinal) {
                  return (
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-[#121826] to-black border border-yellow-500/30 text-center space-y-3">
                      <Trophy className="w-10 h-10 text-yellow-400 mx-auto" />
                      <h3 className="text-base font-black text-white uppercase font-gaming">
                        Current Stage is the Grand Finals
                      </h3>
                      <p className="text-xs text-slate-300 max-w-lg mx-auto">
                        This is the concluding stage of the tournament. No teams need to qualify to further stages.
                        Once all matches conclude, head over to <strong>Tab 4: Crown Champions</strong> to award the trophies and prizes!
                      </p>
                      <button
                        onClick={() => setActiveTab('champions')}
                        className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase font-gaming tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
                      >
                        <Crown className="w-4 h-4" /> Go to Crown Champions Tab
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="p-6 rounded-2xl bg-[#121826] border border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase font-gaming flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-emerald-400" /> Advance Top Teams to Next Stage / Grand Finals
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Extracts the top qualifying teams from each group's cumulative standings and generates the next stage lobby.
                        </p>
                      </div>

                      <button
                        onClick={handlePromoteTeams}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase font-gaming tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                      >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        Qualify Top Teams & Build Next Stage
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Next Stage Name</label>
                        <input
                          type="text"
                          value={nextStageNameInput}
                          onChange={(e) => setNextStageNameInput(e.target.value)}
                          placeholder="e.g. Grand Finals"
                          className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Matches to Schedule</label>
                        <select
                          value={nextStageMatchesInput}
                          onChange={(e) => setNextStageMatchesInput(Number(e.target.value))}
                          className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B]"
                        >
                          <option value={1}>1 Match</option>
                          <option value={2}>2 Matches (Erangel, Miramar)</option>
                          <option value={3}>3 Matches (Erangel, Miramar, Sanhok)</option>
                          <option value={4}>4 Matches</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Final Stage Format</label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 h-9">
                          <input
                            type="checkbox"
                            checked={nextStageIsFinalInput}
                            onChange={(e) => setNextStageIsFinalInput(e.target.checked)}
                            className="w-4 h-4 accent-[#E6002B] rounded"
                          />
                          <span>This is the Final Stage (Crowns Champion)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Show Current Stage Leaderboards */}
              {stagesData.map((stage) => {
                const isFinal = stage.isFinalStage || stage.name?.toLowerCase().includes('final');

                return (
                  <div key={stage._id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase font-gaming flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isFinal ? 'bg-yellow-400' : 'bg-emerald-400'}`}></span>
                        {stage.name} - Overall Standings
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-gaming uppercase ${
                        isFinal ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      }`}>
                        {isFinal ? '🏆 Final Podium Stage (No Qualifications)' : `Top ${stage.qualifyCountPerGroup || 8} Advance`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stage.groups?.map((group) => (
                        <div key={group._id} className="bg-[#121826] border border-white/10 rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs">
                            <span className="font-bold text-white font-gaming">{group.name} Standings</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {group.matches?.length || 0} Matches
                            </span>
                          </div>

                          <div className="overflow-x-auto max-h-56">
                            <table className="w-full text-left text-xs">
                              <thead className="text-[10px] uppercase text-slate-500 bg-black/60">
                                <tr>
                                  <th className="py-1.5 px-3">#</th>
                                  <th className="py-1.5 px-3">Team</th>
                                  <th className="py-1.5 px-3 text-center">WWCD</th>
                                  <th className="py-1.5 px-3 text-center">Pts</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {group.leaderboard?.map((team, idx) => {
                                  const isQualified = !isFinal && idx < (stage.qualifyCountPerGroup || 8);
                                  const isChamp = isFinal && idx === 0;
                                  const isRunner1 = isFinal && idx === 1;
                                  const isRunner2 = isFinal && idx === 2;

                                  return (
                                    <tr
                                      key={team.teamId || idx}
                                      className={`${
                                        isChamp 
                                          ? 'bg-yellow-500/15' 
                                          : isRunner1 
                                          ? 'bg-slate-300/10' 
                                          : isRunner2 
                                          ? 'bg-amber-600/10' 
                                          : isQualified 
                                          ? 'bg-emerald-500/10' 
                                          : ''
                                      }`}
                                    >
                                      <td className="py-1.5 px-3 font-bold text-slate-400">
                                        {isChamp ? '🏆 1' : isRunner1 ? '🥈 2' : isRunner2 ? '🥉 3' : idx + 1}
                                      </td>
                                      <td className="py-1.5 px-3 font-bold text-white flex items-center gap-1.5 truncate">
                                        <span className="truncate">{team.teamName}</span>
                                        {isQualified && (
                                          <span className="text-[9px] text-emerald-400 font-gaming px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                                            QUALIFIED
                                          </span>
                                        )}
                                        {isChamp && (
                                          <span className="text-[9px] text-yellow-300 font-gaming px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/40">
                                            CHAMPION
                                          </span>
                                        )}
                                        {isRunner1 && (
                                          <span className="text-[9px] text-slate-200 font-gaming px-1.5 py-0.5 rounded bg-slate-300/20 border border-slate-300/40">
                                            1ST RUNNER-UP
                                          </span>
                                        )}
                                        {isRunner2 && (
                                          <span className="text-[9px] text-amber-300 font-gaming px-1.5 py-0.5 rounded bg-amber-600/20 border border-amber-600/40">
                                            2ND RUNNER-UP
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-3 text-center font-bold text-amber-400">
                                        {team.wwcd || 0}
                                      </td>
                                      <td className="py-1.5 px-3 text-center font-black text-white">
                                        {team.totalPoints || 0}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: CROWN CHAMPIONS */}
          {activeTab === 'champions' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#121826] to-black border border-amber-500/30 text-center space-y-3">
                <Crown className="w-12 h-12 text-yellow-400 mx-auto" />
                <h3 className="text-xl font-black text-white uppercase font-gaming tracking-wide">
                  Official Tournament Champions Podium
                </h3>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  When all Grand Finals matches have been played, select the Top 3 podium teams to conclude the tournament and award prizes.
                </p>
              </div>

              {/* Grand Finals Leaderboard for quick crowning */}
              {stagesData.length > 0 && (
                <div className="bg-[#121826] border border-white/10 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase font-gaming">
                    Grand Finals Standings (Auto Podium)
                  </h4>

                  {(() => {
                    const finalsStage = stagesData[stagesData.length - 1];
                    const finalsLobby = finalsStage?.groups?.[0];
                    const lb = finalsLobby?.leaderboard || [];

                    if (lb.length < 3) {
                      return (
                        <p className="text-xs text-slate-500 italic">
                          Need at least 3 teams with scored matches in the finals stage to auto-crown.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                          {/* 2nd Place */}
                          <div className="p-4 rounded-xl bg-slate-400/10 border border-slate-400/20 text-center space-y-2">
                            <span className="text-2xl">🥈</span>
                            <p className="text-[11px] font-bold text-slate-400 uppercase font-gaming">2nd Place (Runner-Up)</p>
                            <p className="text-base font-black text-white font-gaming">{lb[1]?.teamName}</p>
                            <p className="text-xs text-slate-400">{lb[1]?.totalPoints} Total Pts</p>
                            <div className="space-y-1.5 pt-2 border-t border-white/5 text-left text-[11px]">
                              <div>
                                <label className="text-zinc-400 block text-[10px]">Prize (₹)</label>
                                <input
                                  type="number"
                                  value={payout2ndAmount}
                                  onChange={(e) => setPayout2ndAmount(e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-zinc-400 block text-[10px]">Runner-Up UPI ID</label>
                                <input
                                  type="text"
                                  value={payout2ndUpi}
                                  onChange={(e) => setPayout2ndUpi(e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 1st Place */}
                          <div className="p-4 rounded-xl bg-yellow-400/15 border border-yellow-400/30 shadow-lg shadow-yellow-400/10 text-center space-y-2">
                            <span className="text-3xl">🥇</span>
                            <p className="text-[11px] font-black text-yellow-400 uppercase font-gaming">🏆 Grand Champion</p>
                            <p className="text-lg font-black text-white font-gaming">{lb[0]?.teamName}</p>
                            <p className="text-xs text-yellow-300 font-bold">{lb[0]?.totalPoints} Total Pts • {lb[0]?.wwcd} WWCD</p>
                            <div className="space-y-1.5 pt-2 border-t border-white/5 text-left text-[11px]">
                              <div>
                                <label className="text-yellow-400 block text-[10px] font-bold">Champion Prize (₹)</label>
                                <input
                                  type="number"
                                  value={payout1stAmount}
                                  onChange={(e) => setPayout1stAmount(e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-black/40 border border-yellow-400/30 text-yellow-200 text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-zinc-400 block text-[10px]">Champion UPI ID</label>
                                <input
                                  type="text"
                                  value={payout1stUpi}
                                  onChange={(e) => setPayout1stUpi(e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 3rd Place */}
                          <div className="p-4 rounded-xl bg-amber-700/10 border border-amber-700/20 text-center space-y-2">
                            <span className="text-2xl">🥉</span>
                            <p className="text-[11px] font-bold text-amber-500 uppercase font-gaming">3rd Place</p>
                            <p className="text-base font-black text-white font-gaming">{lb[2]?.teamName}</p>
                            <p className="text-xs text-slate-400">{lb[2]?.totalPoints} Total Pts</p>
                            <div className="space-y-1.5 pt-2 border-t border-white/5 text-left text-[11px]">
                              <div>
                                <label className="text-zinc-400 block text-[10px]">Prize (₹)</label>
                                <input
                                  type="number"
                                  value={payout3rdAmount}
                                  onChange={(e) => setPayout3rdAmount(e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-zinc-400 block text-[10px]">3rd Place UPI ID</label>
                                <input
                                  type="text"
                                  value={payout3rdUpi}
                                  onChange={(e) => setPayout3rdUpi(e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-center pt-2">
                          <button
                            onClick={() => handleCrownChampions(lb[0], lb[1], lb[2])}
                            disabled={saving}
                            className="px-8 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase font-gaming tracking-wider transition-colors cursor-pointer shadow-lg shadow-yellow-500/20"
                          >
                            Disburse Prize Payouts & Crown Champions
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

        </div>

        {/* SCREENSHOT PROOF MODAL PREVIEW */}
        {previewProofTarget && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121826] border border-white/20 rounded-2xl p-5 max-w-3xl w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white font-gaming uppercase tracking-wide flex items-center gap-2">
                      Slot #{previewProofTarget.slotNumber} • {previewProofTarget.teamName}
                    </h3>
                    <p className="text-xs text-amber-400 font-medium">
                      Claimed: Rank #{previewProofTarget.submittedRank || previewProofTarget.rank} • {previewProofTarget.submittedKills || previewProofTarget.kills} Kills
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (previewProofTarget.submittedRank) {
                        handleScoreChange(previewProofTarget.slotNumber, 'rank', previewProofTarget.submittedRank);
                        handleScoreChange(previewProofTarget.slotNumber, 'kills', previewProofTarget.submittedKills || 0);
                      }
                      setPreviewProofTarget(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase font-gaming flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Auto-Fill Scorecard
                  </button>
                  <button
                    onClick={() => setPreviewProofTarget(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-[65vh] overflow-hidden rounded-xl bg-black border border-white/10 flex items-center justify-center p-2">
                <img
                  src={previewProofTarget.screenshotProof}
                  alt="End game screenshot proof"
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
