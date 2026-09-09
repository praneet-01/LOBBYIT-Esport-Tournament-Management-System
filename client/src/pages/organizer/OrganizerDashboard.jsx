import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { Trophy, FileCheck2, AlertCircle, PlusCircle, ArrowRight, Eye } from 'lucide-react';

export default function OrganizerDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizerData = async () => {
      try {
        const response = await api.get('/tournaments/organizer/my');
        setTournaments(response.data);
      } catch (err) {
        console.error('Error fetching organizer dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerData();
  }, []);

  const totalTournaments = tournaments.length;
  const publishedCount = tournaments.filter(t => t.status === 'published').length;
  const draftCount = tournaments.filter(t => t.status === 'draft').length;
  const totalRegistrations = tournaments.reduce((acc, t) => acc + (t.registeredTeamsCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <Sidebar mode="organizer" />

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Organizer Dashboard</h1>
              <p className="text-xs text-slate-500">Host esports tournaments and manage incoming team registrations.</p>
            </div>
            <Link
              to="/organizer/tournaments/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Host Tournament
            </Link>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Hosted"
              value={totalTournaments}
              icon={Trophy}
              color="purple"
            />
            <StatCard
              title="Published Events"
              value={publishedCount}
              icon={Trophy}
              color="cyan"
            />
            <StatCard
              title="Draft Events"
              value={draftCount}
              icon={AlertCircle}
              color="amber"
            />
            <StatCard
              title="Total Registrations"
              value={totalRegistrations}
              icon={FileCheck2}
              color="green"
            />
          </div>

          {/* Recent Hosted Tournaments */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">My Recent Hosted Tournaments</h3>
              <Link
                to="/organizer/tournaments"
                className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="h-32 bg-slate-100 animate-pulse rounded-xl"></div>
            ) : tournaments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Tournament Title</th>
                      <th className="py-3 px-4">Game</th>
                      <th className="py-3 px-4">Registrations</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {tournaments.slice(0, 5).map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{t.title}</td>
                        <td className="py-3.5 px-4 text-violet-700 font-bold">{t.game}</td>
                        <td className="py-3.5 px-4 font-semibold">{t.registeredTeamsCount || 0} / {t.maxTeams}</td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={t.status} type="tournament" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/organizer/tournaments/${t._id}/registrations`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-violet-600 text-slate-700 hover:text-white font-semibold transition-colors border border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" /> Review Teams
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs space-y-3">
                <p>You haven't hosted any esports tournaments yet.</p>
                <Link
                  to="/organizer/tournaments/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-extrabold shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" /> Host First Tournament
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
