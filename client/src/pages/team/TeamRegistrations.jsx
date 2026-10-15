import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { FileCheck2, Eye, Compass, Trophy } from 'lucide-react';

export default function TeamRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await api.get('/registrations/my');
        setRegistrations(response.data);
      } catch (err) {
        console.error('Failed to load my registrations:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  return (
    <div className="min-h-[85vh] bg-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <Sidebar mode="team" />

          <div className="flex-1 space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide uppercase">
                  MY TOURNAMENT APPLICATIONS
                </h1>
                <p className="text-xs text-slate-400">Track entry status across all applied esports events.</p>
              </div>
              <Link
                to="/tournaments"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase font-gaming transition-colors"
              >
                <Compass className="w-4 h-4" /> Discover Events
              </Link>
            </div>

            {loading ? (
              <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
            ) : registrations.length > 0 ? (
              <div className="bg-[#10141E] rounded-2xl p-6 border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px] font-gaming">
                    <tr>
                      <th className="py-3 px-3">Tournament</th>
                      <th className="py-3 px-3">Game</th>
                      <th className="py-3 px-3">Squad Name</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Date Applied</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-white">
                          {reg.tournament?.title}
                        </td>
                        <td className="py-3.5 px-3 text-cyan-400 font-bold">
                          {reg.tournament?.game}
                        </td>
                        <td className="py-3.5 px-3 text-white font-bold">
                          {reg.teamName || reg.team?.name}
                        </td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={reg.status} type="registration" />
                        </td>
                        <td className="py-3.5 px-3 text-slate-400">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <Link
                            to={`/tournaments/${reg.tournament?.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-200 hover:text-white font-bold text-xs border border-white/10 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Lobby
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[#10141E] rounded-2xl p-12 border border-white/10 text-center space-y-3">
                <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">You haven't submitted any tournament applications yet.</p>
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E6002B] text-white font-bold text-xs uppercase font-gaming"
                >
                  Explore Tournaments
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
