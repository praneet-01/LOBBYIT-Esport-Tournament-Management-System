import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import { Users, Plus, Trash2, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function ManageTeam() {
  const gamesList = ['Valorant', 'BGMI', 'Free Fire', 'CS2', 'Fortnite', 'COD', 'League of Legends', 'Dota 2'];

  const [teamId, setTeamId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    game: 'Valorant',
    country: 'India',
    description: '',
    captain: ''
  });

  const [players, setPlayers] = useState([
    { name: '', inGameName: '', email: '', country: 'India' }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await api.get('/teams/me');
        const t = response.data;
        setTeamId(t._id);
        setFormData({
          name: t.name || '',
          logo: t.logo || '',
          game: t.game || 'Valorant',
          country: t.country || 'India',
          description: t.description || '',
          captain: t.captain || ''
        });
        if (t.players && t.players.length > 0) {
          setPlayers(t.players);
        }
      } catch (err) {
        console.log('No team found for current user, ready to create new');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  const handlePlayerChange = (index, field, value) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const addPlayer = () => {
    setPlayers([...players, { name: '', inGameName: '', email: '', country: 'India' }]);
  };

  const removePlayer = (index) => {
    if (players.length === 1) {
      alert('Team roster must contain at least 1 player.');
      return;
    }
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.name || !formData.game) {
      setMessage({ type: 'error', text: 'Team Name and Game are required' });
      return;
    }

    for (let i = 0; i < players.length; i++) {
      if (!players[i].name || !players[i].inGameName) {
        setMessage({
          type: 'error',
          text: `Player #${i + 1} requires both Full Name and In-Game Name.`
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        players
      };

      if (teamId) {
        await api.put(`/teams/${teamId}`, payload);
        setMessage({ type: 'success', text: 'Team profile and roster updated successfully!' });
      } else {
        const res = await api.post('/teams', payload);
        setTeamId(res.data._id);
        setMessage({ type: 'success', text: 'Team profile created successfully!' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save team profile'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        <Sidebar mode="team" />

        <div className="flex-1 space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Team Profile & Roster</h1>
            <p className="text-xs text-slate-500">Manage team info, captain details, and player in-game names.</p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveTeam} className="space-y-6">
            
            {/* SECTION 1: TEAM INFO */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-violet-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                1. Team Profile Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Team Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Sentinel Prime"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Game *</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600 font-medium"
                  >
                    {gamesList.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Captain Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex 'Viper' Mercer"
                    value={formData.captain}
                    onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Country / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Team Logo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://api.dicebear.com/..."
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Bio</label>
                <textarea
                  rows={2}
                  placeholder="Competitive squad achievements and history..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            {/* SECTION 2: ROSTER */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-sky-700 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" /> 2. Player Roster Lineup ({players.length})
                </h3>
                <button
                  type="button"
                  onClick={addPlayer}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Player
                </button>
              </div>

              <div className="space-y-4">
                {players.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-violet-700">Player #{idx + 1}</span>
                      {players.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlayer(idx)}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Alex Mercer"
                          value={p.name}
                          onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                          required
                          className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">In-Game Name (IGN) *</label>
                        <input
                          type="text"
                          placeholder="e.g. Viper#123"
                          value={p.inGameName}
                          onChange={(e) => handlePlayerChange(idx, 'inGameName', e.target.value)}
                          required
                          className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-violet-700 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Email</label>
                        <input
                          type="email"
                          placeholder="player@esports.gg"
                          value={p.email}
                          onChange={(e) => handlePlayerChange(idx, 'email', e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Country</label>
                        <input
                          type="text"
                          placeholder="e.g. India"
                          value={p.country}
                          onChange={(e) => handlePlayerChange(idx, 'country', e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm shadow-sm flex items-center gap-2"
              >
                {saving ? 'Saving Roster...' : <><Save className="w-4 h-4" /> Save Team Profile & Lineup</>}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
