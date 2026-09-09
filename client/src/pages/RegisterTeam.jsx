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
  UserPlus, 
  ArrowRight 
} from 'lucide-react';

export default function RegisterTeam() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isTeam } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tRes = await api.get(`/tournaments/slug/${slug}`);
        setTournament(tRes.data);

        if (user && isTeam) {
          try {
            const teamRes = await api.get('/teams/me');
            setTeam(teamRes.data);
          } catch (tErr) {
            console.log('No team profile found for this user account');
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Tournament not found');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, user, isTeam]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Preparing registration lobby...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <Users className="w-12 h-12 text-violet-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
        <p className="text-sm text-slate-500">
          You must be signed in as a <strong>Team</strong> user to register for this tournament.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-sm"
          >
            Sign In
          </Link>
          <Link
            to="/register?role=Team"
            className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200"
          >
            Create Team Account
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === 'Organizer') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Organizer Account Detected</h2>
        <p className="text-sm text-slate-500">
          Organizers host tournaments and review team registrations. To register a squad, sign in with a Team account.
        </p>
        <Link
          to="/organizer/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-sm"
        >
          Go to Organizer Dashboard
        </Link>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Team Profile Created</h2>
        <p className="text-sm text-slate-500">
          Set up your team profile and player roster before registering for <strong>{tournament?.title}</strong>.
        </p>
        <Link
          to="/team/my-team"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Create Team Profile Now
        </Link>
      </div>
    );
  }

  const minRequired = tournament?.teamSize?.min || 5;
  const maxRequired = tournament?.teamSize?.max || 7;
  const playerLength = team?.players?.length || 0;
  const isValidLineup = playerLength >= minRequired && playerLength <= maxRequired;

  const handleSubmitRegistration = async () => {
    setError('');
    setSuccess('');

    if (!isValidLineup) {
      setError(`Lineup requirement error: Tournament requires ${minRequired}-${maxRequired} players. Your team has ${playerLength} players.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/registrations', {
        tournamentId: tournament._id,
        teamId: team._id,
        players: team.players
      });

      setSuccess('Registration submitted successfully! Status: Pending Organizer Review');
      setTimeout(() => {
        navigate('/team/registrations');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <Link
        to={`/tournaments/${slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Tournament
      </Link>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Tournament Registration
        </h1>
        <p className="text-sm text-slate-500">
          Review lineup validation requirements and submit your team entry.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* STEP 1 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Step 1 — Target Tournament</span>
        <div className="flex items-center gap-4">
          <img
            src={tournament?.logo || tournament?.banner}
            alt={tournament?.title}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-900">{tournament?.title}</h3>
            <p className="text-xs text-slate-500">
              Game: <strong className="text-slate-800 font-semibold">{tournament?.game}</strong> • Prize Pool: <strong className="text-amber-600 font-bold">{tournament?.prizePool}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* STEP 2 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Step 2 — Selected Team & Roster Lineup</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{team.name}</h3>
          </div>
          <Link
            to="/team/my-team"
            className="text-xs text-violet-700 hover:text-violet-800 font-bold underline"
          >
            Edit Team / Roster
          </Link>
        </div>

        {/* Validation Box */}
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          isValidLineup
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {isValidLineup ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <div>
              <p className="font-bold text-sm">
                Lineup Validation: {isValidLineup ? 'PASSED' : 'INCOMPLETE'}
              </p>
              <p className="text-xs mt-0.5 font-medium">
                Required: {minRequired}-{maxRequired} players. Current roster: {playerLength} players.
              </p>
            </div>
          </div>
          {!isValidLineup && (
            <Link
              to="/team/my-team"
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-xs"
            >
              Add Players
            </Link>
          )}
        </div>

        {/* Player Roster */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Player Lineup Roster</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {team.players.map((p, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                  P{idx + 1}
                </div>
                <div className="overflow-hidden text-xs">
                  <p className="font-bold text-slate-900 truncate">{p.name}</p>
                  <p className="text-slate-500 text-[11px]">IGN: <strong className="text-violet-700">{p.inGameName}</strong> ({p.country})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 3 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Step 3 — Submit Registration</span>
        <p className="text-xs text-slate-600 leading-relaxed">
          By submitting this registration, your team roster will be sent directly to the tournament organizer for review. You will track your application status in your Team Dashboard.
        </p>

        <button
          onClick={handleSubmitRegistration}
          disabled={!isValidLineup || submitting}
          className={`w-full py-4 rounded-xl font-extrabold text-base shadow-sm transition-all flex items-center justify-center gap-2 ${
            isValidLineup && !submitting
              ? 'bg-violet-600 hover:bg-violet-700 text-white cursor-pointer hover:scale-[1.01]'
              : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Submit Tournament Registration <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

    </div>
  );
}
