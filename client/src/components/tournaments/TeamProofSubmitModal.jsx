import React, { useState } from 'react';
import api from '../../services/api';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  ShieldCheck, 
  Flame, 
  RefreshCw 
} from 'lucide-react';

export default function TeamProofSubmitModal({ tournament, stage, group, match, userTeam, onClose, onSubmitted }) {
  const [targetMatchId, setTargetMatchId] = useState(match?._id || group?.matches?.[0]?._id);
  const [slotNumber, setSlotNumber] = useState(1);
  const [submittedRank, setSubmittedRank] = useState(1);
  const [submittedKills, setSubmittedKills] = useState(0);
  const [screenshotProof, setScreenshotProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-detect team's assigned slot in this group if available
  React.useEffect(() => {
    if (group && userTeam) {
      const found = group.teams?.find((t) => 
        (t.team?._id || t.team) === (userTeam._id || userTeam.id)
      );
      if (found) {
        setSlotNumber(found.slotNumber);
      }
    }
  }, [group, userTeam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!screenshotProof.trim()) {
      setError('Please provide a valid image URL for your end-game summary screenshot.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const activeMId = targetMatchId || match?._id;
      const selectedSlotTeam = group?.teams?.find((t) => t.slotNumber === Number(slotNumber));
      const res = await api.post(
        `/tournaments/${tournament._id}/stages/${stage._id}/groups/${group._id}/matches/${activeMId}/submit-proof`,
        {
          teamId: userTeam?._id || userTeam?.id || selectedSlotTeam?.team,
          slotNumber: Number(slotNumber),
          submittedRank: Number(submittedRank),
          submittedKills: Number(submittedKills),
          screenshotProof: screenshotProof.trim()
        }
      );

      setSuccess('Match screenshot and stats submitted successfully! Pending organizer review.');
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit match proof');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0B0E17] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#121826] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-gaming uppercase tracking-wide">
                Submit Match Result Proof
              </h3>
              <p className="text-[11px] text-slate-400">
                {group?.name} • {match?.title || `Match ${match?.matchNumber}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {group?.matches && group.matches.length > 1 && (
            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Select Match Round</label>
              <select
                value={targetMatchId}
                onChange={(e) => setTargetMatchId(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B] font-bold"
              >
                {group.matches.map((m) => (
                  <option key={m._id} value={m._id}>
                    Match {m.matchNumber} ({m.map}) {m.status === 'completed' ? '✓ Completed' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Slot</label>
              {group?.teams && group.teams.length > 0 ? (
                <select
                  value={slotNumber}
                  onChange={(e) => setSlotNumber(Number(e.target.value))}
                  className="mt-1 w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B] font-bold"
                >
                  {group.teams.map((t) => (
                    <option key={t.slotNumber} value={t.slotNumber}>
                      Slot #{t.slotNumber} - {t.teamName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={slotNumber}
                  onChange={(e) => setSlotNumber(e.target.value)}
                  className="mt-1 w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B] text-center font-bold"
                />
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Your Finish Rank</label>
              <input
                type="number"
                min="1"
                max="16"
                value={submittedRank}
                onChange={(e) => setSubmittedRank(e.target.value)}
                className="mt-1 w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B] text-center font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Total Team Kills</label>
              <input
                type="number"
                min="0"
                value={submittedKills}
                onChange={(e) => setSubmittedKills(e.target.value)}
                className="mt-1 w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B] text-center font-bold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                End-Game Screenshot Image URL
              </label>
              <button
                type="button"
                onClick={() => setScreenshotProof('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80')}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                + Paste Demo Screenshot
              </button>
            </div>
            <input
              type="url"
              placeholder="https://imgur.com/your-screenshot.jpg or image link"
              value={screenshotProof}
              onChange={(e) => setScreenshotProof(e.target.value)}
              className="mt-1 w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E6002B]"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Upload your elimination / chicken dinner summary showing team placement and kill counts.
            </p>
          </div>

          {screenshotProof && (
            <div className="rounded-lg overflow-hidden border border-white/10 bg-black/50 max-h-40 flex items-center justify-center p-1">
              <img
                src={screenshotProof}
                alt="Preview"
                className="max-h-36 object-contain rounded"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold font-gaming transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase font-gaming tracking-wide transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#E6002B]/20"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Submit Proof
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
