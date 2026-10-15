import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/dashboard/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { FileCheck2, CheckCircle2, XCircle, Eye, Users, Shield, User, Mail, AtSign, ChevronDown } from 'lucide-react';

export default function OrganizerRegistrations() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournamentsList, setTournamentsList] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(id || '');
  const [tournamentData, setTournamentData] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 1. Fetch all organizer tournaments on load
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await api.get('/tournaments/organizer/my');
        setTournamentsList(response.data || []);
        
        // If no ID passed in URL, default to the first tournament
        if (!id && response.data?.length > 0) {
          setSelectedTournamentId(response.data[0]._id);
        } else if (id) {
          setSelectedTournamentId(id);
        }
      } catch (err) {
        console.error('Error fetching organizer tournaments:', err.message);
      }
    };

    fetchTournaments();
  }, [id]);

  // 2. Fetch registrations whenever selectedTournamentId changes
  const fetchRegistrations = async () => {
    if (!selectedTournamentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/tournaments/${selectedTournamentId}/registrations`);
      setTournamentData(response.data.tournament);
      setRegistrations(response.data.registrations || []);
    } catch (err) {
      console.error('Error fetching registrations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [selectedTournamentId]);

  const handleTournamentSelect = (e) => {
    const newId = e.target.value;
    setSelectedTournamentId(newId);
    navigate(`/organizer/registrations/${newId}`);
  };

  const handleAccept = async (regId) => {
    setProcessing(true);
    try {
      await api.patch(`/registrations/${regId}/accept`);
      setSelectedReg(null);
      await fetchRegistrations();
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
      await fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject registration');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <Sidebar mode="organizer" />

          <div className="flex-1 space-y-6">
            
            {/* Header with tournament dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide uppercase">
                  REGISTERED TEAMS MANAGEMENT
                </h1>
                <p className="text-xs text-slate-400">
                  {tournamentData 
                    ? `Reviewing entries for: ${tournamentData.title}` 
                    : 'Select a tournament to inspect and approve registered squads.'}
                </p>
              </div>

              {/* Tournament Selector Dropdown */}
              {tournamentsList.length > 0 && (
                <div className="relative min-w-[220px]">
                  <select
                    value={selectedTournamentId}
                    onChange={handleTournamentSelect}
                    className="w-full pl-3 pr-8 py-2 rounded-lg bg-[#10141E] border border-white/20 text-white font-gaming text-xs focus:outline-none focus:border-[#E6002B] cursor-pointer appearance-none"
                  >
                    {tournamentsList.map((t) => (
                      <option key={t._id} value={t._id} className="bg-[#10141E] text-white">
                        {t.title} ({t.registeredTeamsCount || 0} teams)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {loading ? (
              <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
            ) : registrations.length > 0 ? (
              <div className="bg-[#10141E] rounded-2xl p-6 border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px] font-gaming">
                    <tr>
                      <th className="py-3 px-3">Team / Squad</th>
                      <th className="py-3 px-3">Squad Leader</th>
                      <th className="py-3 px-3">Lineup Count</th>
                      <th className="py-3 px-3">Date Applied</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={reg.team?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${reg.teamName || reg.team?.name}`}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-white/20"
                            />
                            <div>
                              <p className="font-bold text-white text-xs">{reg.teamName || reg.team?.name}</p>
                              <span className="text-[10px] text-cyan-400 font-semibold font-mono">
                                [{reg.teamTag || reg.team?.tag}]
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-semibold text-slate-200">
                            {reg.players?.[0]?.name || reg.team?.captain?.name || reg.submittedBy?.name || 'In-Game Leader'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {reg.players?.[0]?.email || reg.team?.captain?.email || reg.submittedBy?.email}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-200">
                          {reg.players?.length || reg.team?.players?.length || 0} Players
                        </td>
                        <td className="py-3.5 px-3 text-slate-400">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={reg.status} type="registration" />
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedReg(reg)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1A2030] text-slate-200 hover:text-white font-semibold text-xs border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Roster
                            </button>

                            {reg.status === 'pending' && (
                              <>
                                <button
                                  disabled={processing}
                                  onClick={() => handleAccept(reg._id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  disabled={processing}
                                  onClick={() => {
                                    setSelectedReg(reg);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[#10141E] rounded-2xl p-12 border border-white/10 text-center space-y-3">
                <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white font-gaming">No Entries Submitted Yet</h3>
                <p className="text-xs text-slate-400">
                  {tournamentData 
                    ? `No squads have registered for "${tournamentData.title}" yet.` 
                    : 'Select a tournament above to view entries.'}
                </p>
              </div>
            )}

            {/* Roster Details Modal */}
            {selectedReg && (
              <Modal
                isOpen={!!selectedReg}
                onClose={() => { setSelectedReg(null); setRejectReason(''); }}
                title={`Lineup Roster: ${selectedReg.teamName || selectedReg.team?.name}`}
              >
                <div className="space-y-5">
                  <div className="p-3.5 rounded-xl bg-[#0B0E17] border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{selectedReg.teamName || selectedReg.team?.name}</p>
                      <p className="text-xs text-cyan-400 font-mono">TAG: [{selectedReg.teamTag || selectedReg.team?.tag}]</p>
                    </div>
                    <StatusBadge status={selectedReg.status} type="registration" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 font-gaming uppercase tracking-wider">
                      Player Roster ({selectedReg.players?.length || selectedReg.team?.players?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(selectedReg.players || selectedReg.team?.players || []).map((p, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-[#0B0E17] border border-white/10 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-white flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {(p.isCaptain || idx === 0) && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#E6002B] text-white font-extrabold uppercase">
                                    LEADER
                                  </span>
                                )}
                              </p>
                              <p className="text-slate-400 text-[11px] flex items-center gap-1">
                                <AtSign className="w-3 h-3 text-cyan-400" /> IGN: <strong className="text-slate-200">{p.inGameName}</strong>
                                {p.inGameId && (
                                  <span className="text-slate-400 ml-2 font-mono">• UID: {p.inGameId}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {p.email && (
                            <span className="text-[11px] text-slate-400">{p.email}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reject / Accept actions inside modal */}
                  {selectedReg.status === 'pending' && (
                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Rejection Reason (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Incomplete UID or invalid ranks"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B]"
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          disabled={processing}
                          onClick={() => handleReject(selectedReg._id)}
                          className="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white font-bold text-xs uppercase font-gaming transition-colors cursor-pointer"
                        >
                          Reject Application
                        </button>
                        <button
                          disabled={processing}
                          onClick={() => handleAccept(selectedReg._id)}
                          className="px-5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 font-bold text-xs uppercase font-gaming transition-colors cursor-pointer"
                        >
                          Accept Entry
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </Modal>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
