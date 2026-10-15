import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import { Users, Plus, Trash2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function ManageTeam() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    game: 'Valorant',
    country: 'India',
    players: []
  });

  const fetchTeam = async () => {
    try {
      const response = await api.get('/teams/me');
      setTeam(response.data);
      setFormData({
        name: response.data.name || '',
        tag: response.data.tag || '',
        game: response.data.game || 'Valorant',
        country: response.data.country || 'India',
        players: response.data.players || []
      });
    } catch (err) {
      // User doesn't have a squad profile yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddPlayer = () => {
    setFormData((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        { name: '', inGameName: '', inGameId: '', email: '', role: 'Rifler', isCaptain: false }
      ]
    }));
  };

  const handleRemovePlayer = (idx) => {
    setFormData((prev) => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== idx)
    }));
  };

  const handlePlayerChange = (idx, field, val) => {
    const updated = [...formData.players];
    updated[idx][field] = val;
    setFormData({ ...formData, players: updated });
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Please provide a squad / team name');
      return;
    }

    setSaving(true);
    try {
      if (team) {
        await api.put(`/teams/${team._id}`, formData);
        setSuccess('Squad details updated successfully!');
      } else {
        const res = await api.post('/teams', formData);
        setTeam(res.data);
        setSuccess('Squad profile created successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save squad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <Sidebar mode="team" />

          <div className="flex-1 space-y-6">
            
            <div className="border-b border-white/10 pb-4">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide uppercase">
                MY SQUAD & LINEUP
              </h1>
              <p className="text-xs text-slate-400">
                Manage your default esports roster for quick 1-click tournament registrations.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeam} className="space-y-6">
              
              <div className="bg-[#10141E] rounded-2xl p-6 border border-white/10 space-y-4">
                <h3 className="font-bold text-white text-sm font-gaming uppercase tracking-wider text-cyan-400">
                  Squad Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Squad / Team Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Phoenix Rising"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white text-xs focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Team Tag (3-5 Letters)</label>
                    <input
                      type="text"
                      placeholder="e.g. PHX"
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                      maxLength={5}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white font-mono uppercase text-xs focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>
                </div>
              </div>

              {/* Player Lineup Roster */}
              <div className="bg-[#10141E] rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm font-gaming uppercase tracking-wider text-cyan-400">
                    Roster Players ({formData.players.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddPlayer}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-cyan-400 hover:text-white font-bold text-xs border border-white/10 font-gaming cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Player
                  </button>
                </div>

                {formData.players.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No squad players added yet. Click 'Add Player' above.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.players.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#0B0E17] border border-white/10 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            {idx === 0 ? 'Squad Leader (Captain)' : `Player #${idx + 1}`}
                          </span>
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePlayer(idx)}
                              className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={p.name}
                            onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                            className="px-3 py-2 rounded-lg bg-[#10141E] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B]"
                          />
                          <input
                            type="text"
                            placeholder="In-Game Name (IGN)"
                            value={p.inGameName}
                            onChange={(e) => handlePlayerChange(idx, 'inGameName', e.target.value)}
                            className="px-3 py-2 rounded-lg bg-[#10141E] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B]"
                          />
                          <input
                            type="text"
                            placeholder="In-Game UID / ID"
                            value={p.inGameId || ''}
                            onChange={(e) => handlePlayerChange(idx, 'inGameId', e.target.value)}
                            className="px-3 py-2 rounded-lg bg-[#10141E] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase font-gaming transition-colors cursor-pointer"
                >
                  {saving ? 'Saving Squad...' : 'Save Squad Lineup'}
                </button>
              </div>

            </form>

          </div>

        </div>
      </div>
    </div>
  );
}
