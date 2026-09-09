import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import { FileCheck2, Compass, AlertCircle, Calendar } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        <Sidebar mode="team" />

        <div className="flex-1 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Applications</h1>
              <p className="text-xs text-slate-500">Track entry status for your registered esports tournaments.</p>
            </div>
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm"
            >
              <Compass className="w-4 h-4" /> Discover More
            </Link>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>
          ) : registrations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {registrations.map((r) => (
                <div key={r._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={r.tournament?.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80'}
                        alt={r.tournament?.title}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">{r.tournament?.game}</span>
                        <Link to={`/tournaments/${r.tournament?.slug}`}>
                          <h3 className="font-bold text-slate-900 text-base hover:text-violet-700 transition-colors">
                            {r.tournament?.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <Calendar className="w-3.5 h-3.5" /> Registered: {new Date(r.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status} type="registration" />
                    </div>
                  </div>

                  {r.organizerMessage && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-violet-600" /> Organizer Response:
                      </p>
                      <p className="text-slate-600 italic">"{r.organizerMessage}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs space-y-3 border border-slate-200 shadow-sm">
              <FileCheck2 className="w-10 h-10 text-violet-600 mx-auto" />
              <p className="font-bold text-slate-900 text-sm">No Applications Submitted</p>
              <p>Explore live tournaments and enter your team lineup.</p>
              <Link
                to="/tournaments"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold"
              >
                Browse Tournaments
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
