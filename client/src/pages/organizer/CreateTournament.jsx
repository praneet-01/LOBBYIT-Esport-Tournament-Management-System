import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import { Trophy, ArrowRight, AlertCircle, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function CreateTournament() {
  const navigate = useNavigate();

  const gamesList = ['BGMI', 'Free Fire', 'Valorant', 'FIFA / Football', 'CS2', 'Fortnite', 'COD', 'Rocket League', 'League of Legends', 'Apex Legends'];

  const formatDateForInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const now = new Date();
  const defaultRegDeadline = formatDateForInput(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000));
  const defaultStart = formatDateForInput(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  const defaultEnd = formatDateForInput(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000));

  const [formData, setFormData] = useState({
    title: '',
    game: 'BGMI',
    banner: '',
    description: '',
    tournamentType: 'Online',
    tournamentFormat: 'battle_royale', // 'battle_royale', 'knockout_bracket', 'direct_series'
    matchType: '4v4', // '1v1', '4v4', '5v5'
    seriesLength: 3, // 1, 3, 5
    platform: 'Mobile',
    location: 'Online',
    country: 'India',
    startDate: defaultStart,
    endDate: defaultEnd,
    registrationDeadline: defaultRegDeadline,
    minTeamSize: 4,
    maxTeamSize: 6,
    maxTeams: 32,
    prizePool: '₹50,000',
    isPaid: false,
    entryFee: 50,
    platformFee: 2,
    organizerUpiId: '',
    rules: '1. Standard esports competitive rules apply.\n2. Fair play policy enforced.\n3. Disconnect grace time 10 minutes.',
    stagesCount: 2,
    matchesPerGroup: 2,
    qualifyCountPerGroup: 8,
    pointsSystem: 'BGIS-10'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto adjust presets for convenience
      if (name === 'tournamentFormat') {
        if (value === 'direct_series') {
          updated.maxTeams = 2;
        } else if (value === 'knockout_bracket' && prev.maxTeams === 2) {
          updated.maxTeams = 16;
        }
      }
      if (name === 'matchType') {
        if (value === '1v1') {
          updated.minTeamSize = 1;
          updated.maxTeamSize = 1;
        } else if (value === '4v4') {
          updated.minTeamSize = 4;
          updated.maxTeamSize = 5;
        } else if (value === '5v5') {
          updated.minTeamSize = 5;
          updated.maxTeamSize = 7;
        }
      }
      return updated;
    });
  };

  const handleSave = async (targetStatus) => {
    setError('');

    const { title, game, description } = formData;
    if (!title || !game || !description) {
      setError('Please complete the required fields (Title, Game, and Overview Description).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        game: formData.game,
        banner: formData.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        description: formData.description,
        tournamentType: formData.tournamentType,
        tournamentFormat: formData.tournamentFormat,
        matchType: formData.matchType,
        seriesLength: Number(formData.seriesLength) || 3,
        platform: formData.platform,
        location: formData.location,
        country: formData.country,
        startDate: formData.startDate || defaultStart,
        endDate: formData.endDate || defaultEnd,
        registrationDeadline: formData.registrationDeadline || defaultRegDeadline,
        teamSize: {
          min: Number(formData.minTeamSize) || (formData.matchType === '1v1' ? 1 : 4),
          max: Number(formData.maxTeamSize) || (formData.matchType === '1v1' ? 1 : 6)
        },
        maxTeams: formData.tournamentFormat === 'direct_series' ? 2 : (Number(formData.maxTeams) || 32),
        prizePool: formData.prizePool || '₹50,000',
        isPaid: Boolean(formData.isPaid),
        entryFee: formData.isPaid ? (Math.max(0, Number(formData.entryFee)) || 0) : 0,
        platformFee: 2,
        organizerUpiId: formData.organizerUpiId?.trim() || 'organizer.esports@icici',
        rules: formData.rules || 'Standard competitive rules apply.',
        status: targetStatus,
        brConfig: {
          format: 'Battle Royale',
          stagesCount: Number(formData.stagesCount) || 2,
          matchesPerGroup: Number(formData.matchesPerGroup) || 2,
          qualifyCountPerGroup: Number(formData.qualifyCountPerGroup) || 8,
          pointsSystem: formData.pointsSystem || 'BGIS-10'
        }
      };

      await api.post('/tournaments', payload);
      navigate('/organizer/tournaments');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <Sidebar mode="organizer" />

          <div className="flex-1 space-y-6">
            
            <div className="border-b border-white/10 pb-4">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide uppercase">
                HOST NEW TOURNAMENT
              </h1>
              <p className="text-xs text-slate-400">
                Configure tournament parameters, squad lineup limits, timeline, and prize pool.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-[#10141E] rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-white text-sm font-gaming uppercase tracking-wider text-cyan-400">
                  1. Event Basics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Tournament Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Apex Champions Series - Season 1"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Esports Title (Game) *
                    </label>
                    <select
                      name="game"
                      value={formData.game}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B] transition-colors"
                    >
                      {gamesList.map((g) => (
                        <option key={g} value={g} className="bg-[#0B0E17] text-white">
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Banner Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    name="banner"
                    placeholder="https://example.com/banner.jpg"
                    value={formData.banner}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Tournament Overview Description *
                  </label>
                  <textarea
                    rows={4}
                    name="description"
                    placeholder="Provide overview, format, match schedule, and bracket details..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B] transition-colors"
                  />
                </div>
              </div>

              {/* Tournament Format & Specs */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="font-bold text-white text-sm font-gaming uppercase tracking-wider text-cyan-400">
                  2. Tournament Format & Rules Architecture
                </h3>

                {/* Format Mode Picker */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    onClick={() => handleChange({ target: { name: 'tournamentFormat', value: 'battle_royale' } })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.tournamentFormat === 'battle_royale'
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-[#0B0E17] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs uppercase font-gaming text-amber-400">Battle Royale</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">16-Slot Lobby</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Multi-group lobby system with 16 slots per group, placement rank points & kill multipliers (BGMI, Free Fire BR).
                    </p>
                  </div>

                  <div
                    onClick={() => handleChange({ target: { name: 'tournamentFormat', value: 'knockout_bracket' } })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.tournamentFormat === 'knockout_bracket'
                        ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-[#0B0E17] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs uppercase font-gaming text-cyan-400">Knockout Bracket</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Multi-Team (1v1/4v4)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Team vs Team elimination bracket. E.g., 10 teams paired into 5 matches, winners advance to finals (Clash Squad, Valorant).
                    </p>
                  </div>

                  <div
                    onClick={() => handleChange({ target: { name: 'tournamentFormat', value: 'direct_series' } })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.tournamentFormat === 'direct_series'
                        ? 'bg-purple-500/10 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                        : 'bg-[#0B0E17] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs uppercase font-gaming text-purple-400">2-Team Direct Series</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Showdown / Bo3</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Direct showdown between 2 teams playing Best of 1, 3, or 5 games (e.g. BGMI WOW 4v4 3 matches: first to win 2 wins).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Event Mode</label>
                    <select
                      name="tournamentType"
                      value={formData.tournamentType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    >
                      <option value="Online">Online</option>
                      <option value="LAN">LAN</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Platform</label>
                    <select
                      name="platform"
                      value={formData.platform}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    >
                      <option value="Mobile">Mobile</option>
                      <option value="PC">PC</option>
                      <option value="Console">Console</option>
                      <option value="Cross-Platform">Cross-Platform</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Prize Pool</label>
                    <input
                      type="text"
                      name="prizePool"
                      placeholder="₹50,000 or $1,000"
                      value={formData.prizePool}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>
                </div>

                {/* Entry Fee & Monetization */}
                <div className="p-4 rounded-xl bg-[#0e111a] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-gaming">
                        Registration & Entry Fee Model
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Specify whether teams register for free or pay an entry fee.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, isPaid: false }))}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        !formData.isPaid
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-[#0B0E17] border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase font-gaming text-emerald-400">Free Tournament</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">₹0 Entry</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Any player/team can register freely until maximum team limit is filled.
                      </p>
                    </div>

                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, isPaid: true }))}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.isPaid
                          ? 'bg-[#E6002B]/10 border-[#E6002B] text-white'
                          : 'bg-[#0B0E17] border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase font-gaming text-[#FF2E51]">Paid Tournament</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E6002B]/20 text-[#FF6B85]">Entry + ₹2 Platform Fee</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Teams must pay your registration fee plus ₹2 platform fee via secure gateway.
                      </p>
                    </div>
                  </div>

                  {formData.isPaid && (
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-zinc-300">
                            Squad Registration Fee (₹) *
                          </label>
                          <input
                            type="number"
                            name="entryFee"
                            min="1"
                            placeholder="e.g. 50, 100, 200"
                            value={formData.entryFee}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                          />
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] space-y-1 text-zinc-400 flex flex-col justify-center">
                          <div className="flex justify-between">
                            <span>Team Entry Fee:</span>
                            <span className="text-white font-bold">₹{formData.entryFee || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>LOBBYIT Platform Fee:</span>
                            <span className="text-white font-bold">₹2</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-white/10 text-white font-semibold">
                            <span>Player Total Payable:</span>
                            <span className="text-[#FF2E51] font-bold">₹{(Number(formData.entryFee) || 0) + 2}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
                          <span>Organizer Receiving UPI ID (For Direct Real Bank Payment)</span>
                          <span className="text-[10px] text-emerald-400 font-normal">Real Cash directly to your UPI</span>
                        </label>
                        <input
                          type="text"
                          name="organizerUpiId"
                          placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                          value={formData.organizerUpiId}
                          onChange={handleChange}
                          className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                        />
                        <p className="text-[10px] text-zinc-400">
                          When players scan the UPI QR code on checkout, real money goes directly to this UPI bank account with ₹0 gateway fee.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Max Teams Allowed</label>
                    <input
                      type="number"
                      name="maxTeams"
                      disabled={formData.tournamentFormat === 'direct_series'}
                      value={formData.maxTeams}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B] disabled:opacity-50"
                    />
                    {formData.tournamentFormat === 'direct_series' && (
                      <span className="text-[10px] text-purple-400">Fixed to 2 teams for Direct Series</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Min Squad Players</label>
                    <input
                      type="number"
                      name="minTeamSize"
                      value={formData.minTeamSize}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Max Squad Players</label>
                    <input
                      type="number"
                      name="maxTeamSize"
                      value={formData.maxTeamSize}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>
                </div>
              </div>

              {/* Conditional Format Settings */}
              {formData.tournamentFormat === 'battle_royale' ? (
                /* Battle Royale Stages & Points Engine */
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm font-gaming uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" /> 3. Battle Royale Tournament Stages & Scoring
                    </h3>
                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      Configures groups, matches & points engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Tournament Stages</label>
                      <select
                        name="stagesCount"
                        value={formData.stagesCount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                      >
                        <option value={2}>2 Stages (Qualifiers → Grand Finals)</option>
                        <option value={3}>3 Stages (Qualifiers → Semis → Finals)</option>
                        <option value={1}>1 Stage (Direct Grand Finals Lobby)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Matches Played per Group</label>
                      <select
                        name="matchesPerGroup"
                        value={formData.matchesPerGroup}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                      >
                        <option value={1}>1 Match (Erangel)</option>
                        <option value={2}>2 Matches (Erangel + Miramar)</option>
                        <option value={3}>3 Matches (Erangel + Miramar + Sanhok)</option>
                        <option value={4}>4 Matches (Custom map rotation)</option>
                        <option value={6}>6 Matches (Full pro circuit)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Top Teams Advancing per Group</label>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        name="qualifyCountPerGroup"
                        value={formData.qualifyCountPerGroup}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Points Allocation System</label>
                    <select
                      name="pointsSystem"
                      value={formData.pointsSystem}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    >
                      <option value="BGIS-10">Official BGIS 10-Pt System (#1=10pts, #2=6pts, #3=5pts... + 1pt/finish)</option>
                      <option value="Legacy-15">Legacy 15-Pt System (#1=15pts, #2=12pts, #3=10pts... + 1pt/finish)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Automatic official tiebreakers: Total Points → Chicken Dinners (WWCD) → Placement Points → Kill Points.
                    </p>
                  </div>
                </div>
              ) : (
                /* Head-to-Head & Knockout Bracket Configuration */
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm font-gaming uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-cyan-400" /> 3. Match Format & Series Settings
                    </h3>
                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      1v1 / 4v4 head-to-head match rules
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Match Setup (Players per side)</label>
                      <select
                        name="matchType"
                        value={formData.matchType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                      >
                        <option value="1v1">1v1 (Football / FIFA / Duel / 1-on-1)</option>
                        <option value="4v4">4v4 (Free Fire Clash Squad / BGMI WOW 4v4 / COD)</option>
                        <option value="5v5">5v5 (Valorant / CS2 Tactical)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Series Length (Best-of-N)</label>
                      <select
                        name="seriesLength"
                        value={formData.seriesLength}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                      >
                        <option value={1}>Best of 1 (Single Match - Winner takes all)</option>
                        <option value={3}>Best of 3 (First team to win 2 games wins)</option>
                        <option value={5}>Best of 5 (First team to win 3 games wins)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
                    <p className="font-semibold mb-0.5">
                      {formData.tournamentFormat === 'direct_series' 
                        ? 'Case 1: Direct 2-Team Showdown' 
                        : 'Case 2: Knockout Bracket Elimination'}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {formData.tournamentFormat === 'direct_series'
                        ? `Only 2 teams will compete across a Best-of-${formData.seriesLength} series (e.g., BGMI WOW 3 matches where whoever wins ${Math.ceil(formData.seriesLength / 2)} wins the tournament).`
                        : `All registered teams (e.g. 10 teams -> 5 1v1 match-ups) will be bracketed into matches. Winners automatically advance round-by-round to Semi-Finals and the Grand Final.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="font-bold text-white text-sm font-gaming uppercase tracking-wider text-cyan-400">
                  4. Timeline Schedule
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Registration Deadline</label>
                    <input
                      type="datetime-local"
                      name="registrationDeadline"
                      value={formData.registrationDeadline}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Start Date</label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">End Date</label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="block text-xs font-semibold text-slate-300">
                  Rules & Guidelines
                </label>
                <textarea
                  rows={4}
                  name="rules"
                  value={formData.rules}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#E6002B]"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave('draft')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-300 hover:text-white font-bold text-xs uppercase font-gaming border border-white/10 transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave('published')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase font-gaming transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Publishing...</span>
                  ) : (
                    <>
                      <span>Publish Tournament</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
