import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { PlusCircle, Eye, Trash2, Globe, Lock } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        <Sidebar mode="organizer" />

        <div className="flex-1 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Hosted Tournaments</h1>
              <p className="text-xs text-slate-500">All tournaments created by your organizer profile.</p>
            </div>
            <Link
              to="/organizer/tournaments/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Host Tournament
            </Link>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>
          ) : tournaments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {tournaments.map((t) => (
                <div key={t._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={t.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80'}
                      alt={t.title}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wider">{t.game}</span>
                        <StatusBadge status={t.status} type="tournament" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{t.title}</h3>
                      <p className="text-xs text-slate-500">
                        Prize: <strong className="text-amber-600 font-bold">{t.prizePool}</strong> • Registrations: <strong className="text-slate-900 font-bold">{t.registeredTeamsCount || 0} / {t.maxTeams}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <Link
                      to={`/organizer/tournaments/${t._id}/registrations`}
                      className="px-3.5 py-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> Manage Teams ({t.registeredTeamsCount || 0})
                    </Link>

                    <button
                      onClick={() => handleTogglePublish(t._id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
                        t.status === 'published'
                          ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {t.status === 'published' ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      {t.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                      onClick={() => handleDelete(t._id)}
                      className="p-2 rounded-xl bg-slate-100 text-rose-600 hover:bg-rose-50 border border-slate-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs space-y-3 border border-slate-200">
              <p>No hosted tournaments found.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
