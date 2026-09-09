import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gamepad2, AlertCircle, ArrowRight, Shield, Users, User, Mail, Lock, AtSign } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'Organizer' ? 'Organizer' : 'Team';

  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: initialRole
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, username, email, password, role } = formData;
    if (!name || !username || !email || !password || !role) {
      setError('Please fill in all registration fields');
      return;
    }

    setLoading(true);
    try {
      const user = await register(formData);
      if (user.role === 'Organizer') {
        navigate('/organizer/dashboard');
      } else {
        navigate('/team/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              LOBBY<span className="text-violet-600">IT</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-500">Join organizers and competitive squads on LOBBYIT</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Choice Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'Team' })}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  formData.role === 'Team'
                    ? 'bg-violet-50 border-violet-500 text-violet-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className={`p-2 rounded-lg ${formData.role === 'Team' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Team / Player</p>
                  <p className="text-[10px] text-slate-500">Register & compete</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'Organizer' })}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  formData.role === 'Organizer'
                    ? 'bg-violet-50 border-violet-500 text-violet-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className={`p-2 rounded-lg ${formData.role === 'Organizer' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Organizer</p>
                  <p className="text-[10px] text-slate-500">Host tournaments</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name / Organization
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Alex Mercer"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-violet-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    placeholder="e.g. viper_esports"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-violet-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="alex@esports.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Register as {formData.role} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
            Already registered?{' '}
            <Link to="/login" className="text-violet-700 font-bold hover:underline">
              Sign In
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
