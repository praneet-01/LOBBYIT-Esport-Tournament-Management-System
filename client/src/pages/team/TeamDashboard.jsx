import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { FileCheck2, Clock, CheckCircle2, XCircle, ArrowRight, Compass } from 'lucide-react';

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
          console.log('No team profile registered yet');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        <Sidebar mode="team" />

        <div className="flex-1 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Team Dashboard</h1>
              <p className="text-xs text-slate-500">Track your tournament entries and roster lineup.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/tournaments"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm"
              >
                <Compass className="w-4 h-4" /> Discover Tournaments
              </Link>
            </div>
          </div>

          {!team && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900 text-sm">Setup Team Profile & Lineup Roster</h4>
                <p className="text-xs text-amber-700 font-medium">
                  Before registering for competitive tournaments, set up your team name, logo, and player in-game names.
                </p>
              </div>
              <Link
                to="/team/my-team"
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shrink-0 shadow-sm"
              >
                Setup Team Roster
              </Link>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Entries"
              value={total}
              icon={FileCheck2}
              color="purple"
            />
            <StatCard
              title="Pending Review"
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

          {/* Registrations List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">My Registered Tournaments</h3>
              <Link
                to="/team/registrations"
                className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="h-32 bg-slate-100 animate-pulse rounded-xl"></div>
            ) : registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Tournament</th>
                      <th className="py-3 px-4">Game</th>
                      <th className="py-3 px-4">Applied Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {registrations.slice(0, 5).map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <Link to={`/tournaments/${r.tournament?.slug}`} className="hover:text-violet-700">
                            {r.tournament?.title}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-violet-700 font-bold">{r.tournament?.game}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(r.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={r.status} type="registration" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs space-y-3">
                <p>You haven't registered your team for any tournaments yet.</p>
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold"
                >
                  <Compass className="w-4 h-4" /> Browse Live Tournaments
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
