import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { Trophy, FileCheck2, AlertCircle, PlusCircle, ArrowRight, Eye, Shield } from 'lucide-react';

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
    <div className="min-h-[85vh] bg-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <Sidebar mode="organizer" />

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide uppercase">
                  ORGANIZER COMMAND CENTER
                </h1>
                <p className="text-xs text-slate-400">
                  Host esports tournaments and review registered team applications.
                </p>
              </div>
              <Link
                to="/organizer/tournaments/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-black text-xs uppercase tracking-wider font-gaming transition-colors"
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
            <div className="bg-[#10141E] rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base font-gaming uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#E6002B]" /> My Hosted Tournaments
                </h3>
                <Link
                  to="/organizer/tournaments"
                  className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 font-gaming"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
              ) : tournaments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px] font-gaming">
                      <tr>
                        <th className="py-3 px-3">Tournament</th>
                        <th className="py-3 px-3">Game</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Registrations</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tournaments.slice(0, 5).map((t) => (
                        <tr key={t._id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white">
                            {t.title}
                          </td>
                          <td className="py-3 px-3 text-cyan-400 font-bold">
                            {t.game}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={t.status} type="tournament" />
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-300">
                            {t.registeredTeamsCount || 0} / {t.maxTeams} Teams
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/tournaments/${t.slug}`}
                                className="p-1.5 rounded-lg bg-[#0B0E17] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-colors"
                                title="Public View"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              <Link
                                to={`/organizer/registrations/${t._id}`}
                                className="px-2.5 py-1.5 rounded-lg bg-[#E6002B]/15 border border-[#E6002B]/30 text-[#E6002B] hover:bg-[#E6002B] hover:text-white font-bold text-[11px] transition-colors font-gaming"
                              >
                                Review Teams
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">You haven't hosted any tournaments yet.</p>
                  <Link
                    to="/organizer/tournaments/create"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E6002B] text-white font-bold text-xs uppercase font-gaming"
                  >
                    Host Your First Tournament
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
