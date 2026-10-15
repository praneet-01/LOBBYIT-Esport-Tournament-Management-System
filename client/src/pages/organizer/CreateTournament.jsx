import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import { Trophy, ArrowRight, AlertCircle, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function CreateTournament() {
  const navigate = useNavigate();

  const gamesList = ['Valorant', 'BGMI', 'Free Fire', 'CS2', 'Fortnite', 'COD', 'League of Legends', 'Dota 2', 'Apex Legends'];

  const formatDateForInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const now = new Date();
  const defaultRegDeadline = formatDateForInput(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000));
  const defaultStart = formatDateForInput(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  const defaultEnd = formatDateForInput(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000));

  const [formData, setFormData] = useState({
    title: '',
    game: 'Valorant',
    banner: '',
    description: '',
    tournamentType: 'Online',
    platform: 'PC',
    location: 'Online',
    country: 'India',
    startDate: defaultStart,
    endDate: defaultEnd,
    registrationDeadline: defaultRegDeadline,
    minTeamSize: 5,
    maxTeamSize: 7,
    maxTeams: 32,
    prizePool: '₹50,000',
    rules: '1. Standard esports competitive rules apply.\n2. Fair play policy enforced.\n3. Disconnect grace time 10 minutes.'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        platform: formData.platform,
        location: formData.location,
        country: formData.country,
        startDate: formData.startDate || defaultStart,
        endDate: formData.endDate || defaultEnd,
        registrationDeadline: formData.registrationDeadline || defaultRegDeadline,
        teamSize: {
          min: Number(formData.minTeamSize) || 5,
          max: Number(formData.maxTeamSize) || 7
        },
        maxTeams: Number(formData.maxTeams) || 32,
        prizePool: formData.prizePool || '₹50,000',
        rules: formData.rules || 'Standard competitive rules apply.',
        status: targetStatus
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
                  2. Format, Platform & Team Caps
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Format</label>
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
                      <option value="PC">PC</option>
                      <option value="Mobile">Mobile</option>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Max Teams Allowed</label>
                    <input
                      type="number"
                      name="maxTeams"
                      value={formData.maxTeams}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    />
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

              {/* Schedule */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="font-bold text-white text-sm font-gaming uppercase tracking-wider text-cyan-400">
                  3. Timeline Schedule
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
