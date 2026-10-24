import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  Plus, 
  Trash2,
  ArrowRight,
  UserCheck,
  CreditCard
} from 'lucide-react';
import PaymentCheckoutModal from '../components/common/PaymentCheckoutModal';

export default function RegisterTeam() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Team Details & Lineup State
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [players, setPlayers] = useState([
    { name: user?.name || '', inGameName: user?.username || '', inGameId: '', email: user?.email || '', isCaptain: true }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tRes = await api.get(`/tournaments/slug/${slug}`);
        setTournament(tRes.data);

        // Pre-fill existing team if user has one
        if (user && user.role !== 'Organizer') {
          try {
            const teamRes = await api.get('/teams/me');
            if (teamRes.data) {
              setTeamName(teamRes.data.name || '');
              setTeamTag(teamRes.data.tag || '');
              if (teamRes.data.players && teamRes.data.players.length > 0) {
                setPlayers(teamRes.data.players.map((p, idx) => ({
                  name: p.name || '',
                  inGameName: p.inGameName || '',
                  inGameId: p.inGameId || '',
                  email: p.email || '',
                  isCaptain: idx === 0
                })));
              }
            }
          } catch (tErr) {
            // No existing team, user will enter team name and players directly
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Tournament not found');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, user]);

  // Sync captain name when user loads
  useEffect(() => {
    if (user && players.length > 0 && !players[0].name) {
      setPlayers((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          name: user.name,
          inGameName: user.username,
          email: user.email,
          isCaptain: true
        };
        return updated;
      });
    }
  }, [user]);

  const handleAddPlayer = () => {
    const maxRequired = tournament?.teamSize?.max || 10;
    if (players.length >= maxRequired) {
      setError(`Cannot add more players. Maximum team size is ${maxRequired}.`);
      return;
    }
    setError('');
    setPlayers([
      ...players,
      { name: '', inGameName: '', inGameId: '', email: '', isCaptain: false }
    ]);
  };

  const handleRemovePlayer = (index) => {
    if (index === 0) {
      setError('Cannot remove In-Game Leader (Captain).');
      return;
    }
    setError('');
    setPlayers(players.filter((_, idx) => idx !== index));
  };

  const handlePlayerChange = (index, field, value) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!teamName.trim()) {
      setError('Please provide a Team / Squad Name.');
      return;
    }

    const minRequired = tournament?.teamSize?.min || 1;
    const maxRequired = tournament?.teamSize?.max || 10;

    if (players.length < minRequired || players.length > maxRequired) {
      setError(`Tournament requirement error: Lineup requires between ${minRequired} and ${maxRequired} players. You currently have ${players.length}.`);
      return;
    }

    // Verify all players have name and in-game name
    for (let i = 0; i < players.length; i++) {
      if (!players[i].name.trim() || !players[i].inGameName.trim()) {
        setError(`Please fill in Player Name and In-Game Name for Player #${i + 1}.`);
        return;
      }
    }

    // If paid tournament, require payment checkout first
    const isPaid = Boolean(tournament?.isPaid && tournament?.entryFee > 0);
    if (isPaid) {
      setShowPaymentModal(true);
      return;
    }

    // Direct registration for free tournament
    await executeFinalRegistration();
  };

  const executeFinalRegistration = async (paymentData = null) => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        tournamentId: tournament._id,
        teamName: teamName.trim(),
        teamTag: teamTag.trim() || teamName.substring(0, 4).toUpperCase(),
        players: players
      };

      if (paymentData) {
        payload.paymentTxnId = paymentData.txnId;
        payload.paymentMethod = paymentData.paymentMethod;
        payload.paymentAmount = paymentData.amount;
      }

      await api.post('/registrations', payload);

      setShowPaymentModal(false);
      setSuccess(
        paymentData 
          ? `Payment verified (Txn: ${paymentData.txnId})! Team registration submitted successfully.` 
          : 'Team registration submitted successfully! Status: Pending Organizer Review.'
      );
      setTimeout(() => {
        navigate('/tournaments');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    await executeFinalRegistration(paymentData);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#E6002B] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-slate-400 text-xs">Preparing tournament registration lobby...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#10141E] rounded-xl border border-white/10 text-center space-y-4">
        <Users className="w-12 h-12 text-[#E6002B] mx-auto" />
        <h2 className="text-xl font-bold text-white font-gaming">Sign In Required</h2>
        <p className="text-xs text-slate-400">
          You must be signed in as a player to register your team for this tournament.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            to="/login"
            className="px-5 py-2 rounded-lg bg-[#E6002B] text-white font-bold text-xs uppercase tracking-wider font-gaming"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-lg bg-[#141824] text-slate-200 font-bold text-xs uppercase tracking-wider border border-white/15 font-gaming"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === 'Organizer') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#10141E] rounded-xl border border-white/10 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white font-gaming">Organizer Account Detected</h2>
        <p className="text-xs text-slate-400">
          Organizers host tournaments. To register a squad as an In-Game Leader, sign in with a Player account.
        </p>
        <Link
          to="/organizer/dashboard"
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#E6002B] text-white font-bold text-xs uppercase font-gaming"
        >
          Go to Organizer Dashboard
        </Link>
      </div>
    );
  }

  const minRequired = tournament?.teamSize?.min || 1;
  const maxRequired = tournament?.teamSize?.max || 10;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 bg-black text-slate-100 min-h-[85vh]">
      
      <Link
        to={`/tournaments/${slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Tournament
      </Link>

      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming tracking-wide">
          Team Registration & Lineup Submission
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          As the In-Game Leader, enter your squad details, gamer tags, and in-game IDs to compete.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Target Tournament Summary Banner */}
      <div className="bg-[#10141E] rounded-xl p-5 border border-white/10 flex items-center gap-4">
        <img
          src={tournament?.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80'}
          alt={tournament?.title}
          className="w-16 h-16 rounded-lg object-cover border border-white/10"
        />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider font-gaming">
              {tournament?.game} • {tournament?.tournamentType}
            </span>
            {tournament?.isPaid && tournament?.entryFee > 0 ? (
              <span className="text-[10px] font-bold text-[#FF6B85] bg-[#E6002B]/15 border border-[#E6002B]/30 px-2 py-0.5 rounded font-gaming">
                Paid: ₹{tournament.entryFee} Entry + ₹{tournament.platformFee || 2} Platform Fee (Total: ₹{tournament.entryFee + (tournament.platformFee || 2)})
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-gaming">
                Free Registration (₹0)
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-black text-white font-gaming">{tournament?.title}</h3>
          <p className="text-xs text-slate-400">
            Roster Requirements: <strong className="text-white">{minRequired} - {maxRequired} Players</strong> (including In-Game Leader)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitRegistration} className="space-y-6">
        
        {/* STEP 1: Team / Squad Info */}
        <div className="bg-[#10141E] rounded-xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-gaming border-b border-white/10 pb-2">
            1. Team / Squad Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Team / Squad Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sentinels Esports"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Team Tag / Shorthand
              </label>
              <input
                type="text"
                placeholder="e.g. SEN"
                maxLength={6}
                value={teamTag}
                onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg bg-[#0B0E17] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B]"
              />
            </div>
          </div>
        </div>

        {/* STEP 2: In-Game Leader & Teammates Lineup */}
        <div className="bg-[#10141E] rounded-xl p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-gaming">
                2. Player Lineup & Gamer IDs ({players.length} / {maxRequired})
              </h3>
              <p className="text-[11px] text-slate-400">
                Provide In-Game Name (IGN) and In-Game ID / UID for each competitor.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddPlayer}
              disabled={players.length >= maxRequired}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1C2232] text-cyan-400 border border-white/10 text-xs font-bold font-gaming transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Teammate
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {players.map((player, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border space-y-3 ${
                  index === 0 
                    ? 'bg-[#121826] border-cyan-500/30' 
                    : 'bg-[#0B0E17] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-gaming">
                      Player #{index + 1}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider font-gaming flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> In-Game Leader (Captain)
                      </span>
                    )}
                  </div>

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(index)}
                      className="text-red-400 hover:text-red-300 p-1 text-xs transition-colors"
                      title="Remove Player"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-400">
                      Full / Player Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tyson Ngo"
                      value={player.name}
                      onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#141824] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-400">
                      In-Game Name (IGN) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TenZ#1337"
                      value={player.inGameName}
                      onChange={(e) => handlePlayerChange(index, 'inGameName', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#141824] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-400">
                      In-Game ID / UID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 984210398"
                      value={player.inGameId}
                      onChange={(e) => handlePlayerChange(index, 'inGameId', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#141824] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#E6002B]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-400">
            By submitting, you certify that all entered player IGNs and gamer IDs are accurate.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#E6002B] hover:bg-[#C90022] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 font-gaming disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {submitting ? (
              <span>Submitting Lineup...</span>
            ) : tournament?.isPaid && tournament?.entryFee > 0 ? (
              <>
                <span>Pay ₹{(Number(tournament.entryFee) || 0) + 2} & Register</span>
                <CreditCard className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Submit Team Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>

      {/* Free Test Payment Gateway Modal */}
      <PaymentCheckoutModal
        tournament={tournament}
        teamName={teamName}
        user={user}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

    </div>
  );
}
