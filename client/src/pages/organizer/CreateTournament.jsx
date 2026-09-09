import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import { Trophy, ArrowRight, AlertCircle, PlusCircle } from 'lucide-react';

export default function CreateTournament() {
  const navigate = useNavigate();

  const gamesList = ['Valorant', 'BGMI', 'Free Fire', 'CS2', 'Fortnite', 'COD', 'League of Legends', 'Dota 2'];

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
        banner: formData.banner || 'https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        <Sidebar mode="organizer" />

        <div className="flex-1 space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Host New Tournament</h1>
            <p className="text-xs text-slate-500">Configure tournament information, player lineup limits, schedule, and prize pool.</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-violet-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                1. Tournament Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tournament Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. LOBBYIT Valorant Championship 2026"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Esports Game Title *
                  </label>
                  <select
                    name="game"
                    value={formData.game}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600 font-medium"
                  >
                    {gamesList.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="text"
                  name="banner"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.banner}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tournament Overview Description *
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe your tournament format, eligibility, and organizer details..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            {/* Section 2: Format & Schedule */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                2. Format & Schedule
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Format Mode</label>
                  <select
                    name="tournamentType"
                    value={formData.tournamentType}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Platform</label>
                  <input
                    type="text"
                    name="platform"
                    placeholder="e.g. PC / Mobile / Console"
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Location / Server</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Mumbai Server / Custom Room"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Registration Deadline *</label>
                  <input
                    type="datetime-local"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Start Date *</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">End Date *</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Lineup Rules & Prize */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider border-b border-slate-100 pb-2">
                3. Lineup Rules & Prize Pool
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Min Team Size</label>
                  <input
                    type="number"
                    name="minTeamSize"
                    value={formData.minTeamSize}
                    onChange={handleChange}
                    min={1}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Max Team Size</label>
                  <input
                    type="number"
                    name="maxTeamSize"
                    value={formData.maxTeamSize}
                    onChange={handleChange}
                    min={1}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Max Capacity (Teams)</label>
                  <input
                    type="number"
                    name="maxTeams"
                    value={formData.maxTeams}
                    onChange={handleChange}
                    min={2}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Prize Pool</label>
                  <input
                    type="text"
                    name="prizePool"
                    placeholder="e.g. ₹50,000"
                    value={formData.prizePool}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rules & Fair Play Guidelines
                </label>
                <textarea
                  name="rules"
                  rows={4}
                  value={formData.rules}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSave('draft')}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors"
              >
                Save Draft
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSave('published')}
                className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2"
              >
                {loading ? 'Publishing...' : 'Publish Tournament'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
