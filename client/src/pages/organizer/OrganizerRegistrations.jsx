import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { FileCheck2, CheckCircle2, XCircle, Eye, Users } from 'lucide-react';

export default function OrganizerRegistrations() {
  const { id } = useParams();
  const [tournamentData, setTournamentData] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchRegistrations = async () => {
    try {
      if (id) {
        const response = await api.get(`/tournaments/${id}/registrations`);
        setTournamentData(response.data.tournament);
        setRegistrations(response.data.registrations);
      } else {
        const tRes = await api.get('/tournaments/organizer/my');
        if (tRes.data.length > 0) {
          const regRes = await api.get(`/tournaments/${tRes.data[0]._id}/registrations`);
          setTournamentData(regRes.data.tournament);
          setRegistrations(regRes.data.registrations);
        }
      }
    } catch (err) {
      console.error('Error fetching registrations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [id]);

  const handleAccept = async (regId) => {
    setProcessing(true);
    try {
      await api.patch(`/registrations/${regId}/accept`);
      setSelectedReg(null);
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept registration');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (regId) => {
    setProcessing(true);
    try {
      await api.patch(`/registrations/${regId}/reject`, {
        organizerMessage: rejectReason
      });
      setSelectedReg(null);
      setRejectReason('');
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject registration');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        <Sidebar mode="organizer" />

        <div className="flex-1 space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Registered Teams Management</h1>
            <p className="text-xs text-slate-500">
              {tournamentData ? `Reviewing applications for: ${tournamentData.title}` : 'Review team rosters and manage entry acceptances.'}
            </p>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>
          ) : registrations.length > 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Captain</th>
                    <th className="py-3 px-4">Players</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {registrations.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                        <img
                          src={r.team?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${r.team?.name}`}
                          alt={r.team?.name}
                          className="w-8 h-8 rounded-full border border-violet-500 object-cover"
                        />
                        <span>{r.team?.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{r.team?.captain || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-bold text-violet-700">{r.players?.length || 0} Lineup Players</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} type="registration" />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedReg(r)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Lineup
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs space-y-2 border border-slate-200 shadow-sm">
              <FileCheck2 className="w-10 h-10 text-violet-600 mx-auto" />
              <p className="font-bold text-slate-900 text-sm">No Registrations Received Yet</p>
              <p>Teams registering for your tournament will appear here for verification.</p>
            </div>
          )}

        </div>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={!!selectedReg}
        onClose={() => setSelectedReg(null)}
        title="Team Registration Verification"
      >
        {selectedReg && (
          <div className="space-y-6 text-xs">
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={selectedReg.team?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedReg.team?.name}`}
                alt={selectedReg.team?.name}
                className="w-14 h-14 rounded-full border-2 border-violet-500 object-cover"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedReg.team?.name}</h3>
                <p className="text-slate-600 font-medium">
                  Captain: <strong className="text-slate-900">{selectedReg.team?.captain}</strong> • Country: <strong className="text-slate-900">{selectedReg.team?.country}</strong>
                </p>
                <div className="mt-1">
                  <StatusBadge status={selectedReg.status} type="registration" />
                </div>
              </div>
            </div>

            {/* Lineup Roster */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" /> Submitted Player Lineup ({selectedReg.players?.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedReg.players?.map((p, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{p.name}</span>
                      <span className="text-violet-700">P{i+1}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      In-Game Name: <strong className="text-sky-700">{p.inGameName}</strong>
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      Country: {p.country}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Message */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-700">
                Organizer Response Message (Optional for rejection reason)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Lineup player in-game names require verification..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-violet-600"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                disabled={processing}
                onClick={() => handleReject(selectedReg._id)}
                className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Reject Registration
              </button>
              <button
                disabled={processing}
                onClick={() => handleAccept(selectedReg._id)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Accept Registration
              </button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
