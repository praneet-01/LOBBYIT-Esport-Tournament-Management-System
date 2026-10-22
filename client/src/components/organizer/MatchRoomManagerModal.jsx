import React, { useState } from 'react';
import api from '../../services/api';
import { 
  X, 
  Plus, 
  MapPin, 
  Key, 
  Hash, 
  Clock, 
  Radio, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  AlertCircle,
  Gamepad2,
  FileText,
  ShieldAlert
} from 'lucide-react';

const GAME_MAPS = {
  bgmi: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Rondo', 'Karakin', 'Nusa'],
  'free-fire': ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'NeXTerra'],
  'free fire': ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'NeXTerra'],
  valorant: ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Lotus', 'Sunset', 'Abyss'],
  cs2: ['Mirage', 'Inferno', 'Nuke', 'Dust II', 'Ancient', 'Anubis', 'Vertigo'],
  efootball: ['Standard Stadium', 'Camp Nou', 'San Siro', 'Allianz Arena']
};

export default function MatchRoomManagerModal({ tournament, onClose, onUpdated }) {
  const [matches, setMatches] = useState(tournament?.matches || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // Form State
  const defaultNextNum = (matches?.length || 0) + 1;
  const [matchNumber, setMatchNumber] = useState(defaultNextNum);
  const [title, setTitle] = useState(`Match ${defaultNextNum}`);
  const [map, setMap] = useState('');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [status, setStatus] = useState('upcoming');

  const gameKey = (tournament?.game || '').toLowerCase().trim();
  const suggestedMaps = GAME_MAPS[gameKey] || ['Map 1', 'Map 2', 'Custom Map'];

  const resetForm = () => {
    const nextNum = (matches?.length || 0) + 1;
    setMatchNumber(nextNum);
    setTitle(`Match ${nextNum}`);
    setMap('');
    setRoomId('');
    setPassword('');
    setCustomNote('');
    setStatus('upcoming');
    setEditingMatchId(null);
    setIsAdding(false);
    setError('');
  };

  const startEdit = (m) => {
    setEditingMatchId(m._id);
    setMatchNumber(m.matchNumber || 1);
    setTitle(m.title || `Match ${m.matchNumber}`);
    setMap(m.map || '');
    setRoomId(m.roomId || '');
    setPassword(m.password || '');
    setCustomNote(m.customNote || '');
    setStatus(m.status || 'upcoming');
    setIsAdding(true);
    setError('');
  };

  const handleSaveMatch = async (e) => {
    e.preventDefault();
    if (!map.trim()) {
      setError('Please provide or select a Map name for this match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        matchNumber: Number(matchNumber),
        title: title.trim() || `Match ${matchNumber} - ${map.trim()}`,
        map: map.trim(),
        roomId: roomId.trim(),
        password: password.trim(),
        customNote: customNote.trim(),
        status
      };

      let response;
      if (editingMatchId) {
        response = await api.put(`/tournaments/${tournament._id}/matches/${editingMatchId}`, payload);
      } else {
        response = await api.post(`/tournaments/${tournament._id}/matches`, payload);
      }

      const updatedMatches = response.data.matches || [];
      setMatches(updatedMatches);
      setSuccessMsg(editingMatchId ? 'Match & Room ID updated! Registered players can view it immediately.' : 'New Match Round created and published!');
      if (onUpdated) onUpdated(updatedMatches);
      resetForm();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save match room credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match round?')) return;
    setLoading(true);
    try {
      const res = await api.delete(`/tournaments/${tournament._id}/matches/${matchId}`);
      const updatedMatches = res.data.matches || [];
      setMatches(updatedMatches);
      if (onUpdated) onUpdated(updatedMatches);
      setSuccessMsg('Match round deleted.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete match.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-[#0F131D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#141926]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E6002B]/10 border border-[#E6002B]/20 text-[#E6002B]">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-gaming tracking-wide uppercase">
                Match Rounds & Room Control
              </h2>
              <p className="text-xs text-slate-400">
                {tournament?.title} • <span className="text-cyan-400 font-bold uppercase">{tournament?.game}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time sync banner */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-black border-b border-cyan-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-cyan-300">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span><strong>Live Player Sync:</strong> Registered teams see Map, Room ID & Password automatically within 10s of sharing.</span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
            {matches.length} Total Matches
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form: Add or Edit Match Round */}
          {isAdding ? (
            <form onSubmit={handleSaveMatch} className="p-5 rounded-2xl bg-[#141926] border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-gaming flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#E6002B]" />
                  {editingMatchId ? 'Edit Match Round & Room Credentials' : 'Create New Match Round'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Match Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={matchNumber}
                    onChange={(e) => setMatchNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/10 text-white text-xs focus:border-[#E6002B] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Match Title / Round Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Match 1 - Erangel Tactical"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/10 text-white text-xs focus:border-[#E6002B] outline-none"
                  />
                </div>
              </div>

              {/* Map Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Select or Enter Map Name <span className="text-red-400">*</span>
                </label>
                
                {/* Quick Map Pills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {suggestedMaps.map((mapOption) => (
                    <button
                      key={mapOption}
                      type="button"
                      onClick={() => setMap(mapOption)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        map.toLowerCase() === mapOption.toLowerCase()
                          ? 'bg-[#E6002B] text-white shadow-sm'
                          : 'bg-[#0B0E17] text-slate-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      🗺️ {mapOption}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Erangel, Bermuda, Miramar, Ascent..."
                    value={map}
                    onChange={(e) => setMap(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B0E17] border border-white/10 text-white text-xs focus:border-[#E6002B] outline-none"
                  />
                </div>
              </div>

              {/* Room ID and Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0B0E17] border border-white/10">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> Custom Room ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7481920 or VAL-CUSTOM"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#141926] border border-white/10 font-mono text-white text-xs focus:border-emerald-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty until room is created in-game.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Room Password
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. godlike123 or pass@2026"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#141926] border border-white/10 font-mono text-white text-xs focus:border-emerald-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Shared securely with registered squads only.</p>
                </div>
              </div>

              {/* Custom Note and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Slot / Captain Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Join Slot 1-12 strictly. 10 mins window before start."
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/10 text-white text-xs focus:border-[#E6002B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Match Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/10 text-white text-xs focus:border-[#E6002B] outline-none"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">🔴 Live / Room Open</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase tracking-wider font-gaming disabled:opacity-50 cursor-pointer shadow-lg shadow-[#E6002B]/20"
                >
                  {loading ? 'Saving...' : editingMatchId ? 'Update & Broadcast Credentials' : 'Publish Match Round'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="w-full py-3.5 px-4 rounded-xl border border-dashed border-white/20 hover:border-[#E6002B] bg-white/5 hover:bg-[#E6002B]/5 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider font-gaming transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E6002B]" />
              Add Match Round / Custom Map (e.g. Erangel, Bermuda, Miramar...)
            </button>
          )}

          {/* List of matches */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-gaming">
              Configured Matches ({matches.length})
            </h3>

            {matches.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#0B0E17] border border-white/10 text-center space-y-2">
                <Gamepad2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No match rounds configured for this tournament yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click "Add Match Round" above to specify maps (e.g. Erangel, Bermuda) and share Room IDs with registered teams.
                </p>
              </div>
            ) : (
              matches.map((m, index) => {
                const isLive = m.status === 'live' || Boolean(m.roomId && m.status !== 'completed');
                const hasCredentials = Boolean(m.roomId);

                return (
                  <div
                    key={m._id || index}
                    className={`p-4 rounded-xl border transition-all ${
                      isLive 
                        ? 'bg-gradient-to-r from-emerald-950/20 via-[#10141E] to-[#10141E] border-emerald-500/40' 
                        : 'bg-[#10141E] border-white/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white text-xs font-mono">
                          #{m.matchNumber || index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white font-gaming">
                              {m.title || `Match ${m.matchNumber || index + 1}`}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              🗺️ {m.map}
                            </span>
                          </div>
                          {m.customNote && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{m.customNote}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          m.status === 'live' 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                            : m.status === 'completed'
                            ? 'bg-slate-500/15 text-slate-400 border border-white/10'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {m.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
                          {m.status || 'upcoming'}
                        </span>

                        <button
                          onClick={() => startEdit(m)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="Edit match & room credentials"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMatch(m._id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Delete match round"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Room credentials display */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#0B0E17] border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Room ID</span>
                          <span className="font-mono font-bold text-white text-sm">
                            {m.roomId || <span className="text-slate-500 font-sans font-normal italic">Not set yet</span>}
                          </span>
                        </div>
                        {m.roomId && (
                          <button
                            onClick={() => copyToClipboard(m.roomId, `room-${m._id}`)}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                            title="Copy Room ID"
                          >
                            {copiedId === `room-${m._id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#0B0E17] border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Password</span>
                          <span className="font-mono font-bold text-white text-sm">
                            {m.password || <span className="text-slate-500 font-sans font-normal italic">Not set yet</span>}
                          </span>
                        </div>
                        {m.password && (
                          <button
                            onClick={() => copyToClipboard(m.password, `pass-${m._id}`)}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                            title="Copy Password"
                          >
                            {copiedId === `pass-${m._id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Announcement copy button for organizer */}
                    {hasCredentials && (
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Live to registered squads
                        </span>
                        <button
                          onClick={() => {
                            const text = `🎮 ${tournament?.title} | ${m.title || 'Match ' + m.matchNumber} (${m.map})\nRoom ID: ${m.roomId}\nPassword: ${m.password}${m.customNote ? '\nNote: ' + m.customNote : ''}`;
                            copyToClipboard(text, `full-${m._id}`);
                          }}
                          className="flex items-center gap-1 text-slate-300 hover:text-white font-semibold cursor-pointer"
                        >
                          {copiedId === `full-${m._id}` ? (
                            <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied Announcement!</span>
                          ) : (
                            <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Discord / WhatsApp text</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141926] flex items-center justify-between text-xs text-slate-400">
          <span>Need to run another match? Add multiple rounds (e.g. Erangel, then Miramar).</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold uppercase transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
