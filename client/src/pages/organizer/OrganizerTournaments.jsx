import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { PlusCircle, Eye, Trash2, Globe, Lock, Shield } from 'lucide-react';

export default function OrganizerTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = async () => {
    try {
      const response = await api.get('/tournaments/organizer/my');
      setTournaments(response.data);
    } catch (err) {
      console.error('Failed to load organizer tournaments:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleTogglePublish = async (id) => {
    try {
      await api.patch(`/tournaments/${id}/publish`);
      fetchTournaments();
    } catch (err) {
      alert(err.response?.data?.message || 'Publish toggle failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tournament and its registrations?')) return;
    try {
      await api.delete(`/tournaments/${id}`);
      fetchTournaments();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-[85vh] bg-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <Sidebar mode="organizer" />

          <div className="flex-1 space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide uppercase">
                  MY HOSTED TOURNAMENTS
                </h1>
                <p className="text-xs text-slate-400">Manage status, review registrations, and launch events.</p>
              </div>
              <Link
                to="/organizer/tournaments/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase font-gaming transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> New Tournament
              </Link>
            </div>

            {loading ? (
              <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
            ) : tournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map((t) => (
                  <div
                    key={t._id}
                    className="p-5 rounded-2xl bg-[#10141E] border border-white/10 space-y-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-gaming">
                          {t.game}
                        </span>
                        <h3 className="font-bold text-white text-base mt-2">{t.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{t.tournamentType} • {t.platform}</p>
                      </div>
                      <StatusBadge status={t.status} type="tournament" />
                    </div>

                    <div className="p-3 rounded-lg bg-[#0B0E17] border border-white/10 text-xs flex justify-between items-center text-slate-300">
                      <span>Applications:</span>
                      <strong className="text-white font-mono font-bold">
                        {t.registeredTeamsCount || 0} / {t.maxTeams} Teams
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/organizer/registrations/${t._id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#E6002B]/15 border border-[#E6002B]/30 text-[#E6002B] hover:bg-[#E6002B] hover:text-white font-bold text-xs transition-colors font-gaming"
                        >
                          Review Teams ({t.registeredTeamsCount || 0})
                        </Link>
                        <Link
                          to={`/tournaments/${t.slug}`}
                          className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-300 hover:text-white border border-white/10 transition-colors"
                          title="View Public Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePublish(t._id)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-300 hover:text-white border border-white/10 transition-colors font-bold text-[11px] cursor-pointer"
                        >
                          {t.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#10141E] rounded-2xl p-12 border border-white/10 text-center space-y-3">
                <p className="text-xs text-slate-400">No tournaments created yet.</p>
                <Link
                  to="/organizer/tournaments/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E6002B] text-white font-bold text-xs uppercase font-gaming"
                >
                  Create Tournament
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
