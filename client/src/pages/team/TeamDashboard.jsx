import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { FileCheck2, Clock, CheckCircle2, XCircle, ArrowRight, Compass, Users } from 'lucide-react';

export default function TeamDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamDashboardData = async () => {
      try {
        const regRes = await api.get('/registrations/my');
        setRegistrations(regRes.data);

        try {
          const teamRes = await api.get('/teams/me');
          setTeam(teamRes.data);
        } catch (tErr) {
          // No team profile yet
        }
      } catch (err) {
        console.error('Error loading team dashboard:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDashboardData();
  }, []);

  const total = registrations.length;
  const pending = registrations.filter(r => r.status === 'pending').length;
  const accepted = registrations.filter(r => r.status === 'accepted').length;
  const rejected = registrations.filter(r => r.status === 'rejected').length;

  return (
    <div className="min-h-[85vh] bg-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <Sidebar mode="team" />

          <div className="flex-1 space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide uppercase">
                  PLAYER & SQUAD HUB
                </h1>
                <p className="text-xs text-slate-400">Track your tournament entries, review application statuses, and manage your squad.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase font-gaming transition-colors"
                >
                  <Compass className="w-4 h-4" /> Discover Tournaments
                </Link>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Entries"
                value={total}
                icon={FileCheck2}
                color="purple"
              />
              <StatCard
                title="Pending"
                value={pending}
                icon={Clock}
                color="amber"
              />
              <StatCard
                title="Accepted"
                value={accepted}
                icon={CheckCircle2}
                color="green"
              />
              <StatCard
                title="Rejected"
                value={rejected}
                icon={XCircle}
                color="rose"
              />
            </div>

            {/* Recent Registrations Table */}
            <div className="bg-[#10141E] rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base font-gaming uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-400" /> Recent Tournament Entries
                </h3>
                <Link
                  to="/team/registrations"
                  className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 font-gaming"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
              ) : registrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px] font-gaming">
                      <tr>
                        <th className="py-3 px-3">Tournament</th>
                        <th className="py-3 px-3">Squad Name</th>
                        <th className="py-3 px-3">Date Applied</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {registrations.slice(0, 5).map((reg) => (
                        <tr key={reg._id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white">
                            {reg.tournament?.title}
                          </td>
                          <td className="py-3 px-3 text-cyan-400 font-bold">
                            {reg.teamName || reg.team?.name}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {new Date(reg.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={reg.status} type="registration" />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              to={`/tournaments/${reg.tournament?.slug}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-200 hover:text-white font-bold text-xs border border-white/10 transition-colors"
                            >
                              Tournament Lobby
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <Users className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">You haven't joined any tournaments yet.</p>
                  <Link
                    to="/tournaments"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E6002B] text-white font-bold text-xs uppercase font-gaming"
                  >
                    Find Tournaments
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
