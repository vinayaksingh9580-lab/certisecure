import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokenResponse = await login(email, password);
      const targetPath = tokenResponse.user.role === 'verifier' ? '/student/certificates' : '/dashboard';
      navigate(targetPath);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Invalid credentials or backend server unavailable.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-500/20 mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign In to CertiSecure2</h1>
          <p className="text-gray-400 text-sm mt-1">Access Admin, Issuer, or Verifier Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-2xl border border-gray-800 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@certisecure.dev"
                  className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Quick Demo Accounts (SIH 2026):
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@certisecure.dev', 'Admin@2026')}
                className="w-full p-2.5 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-800 text-left flex justify-between items-center text-gray-300 transition-colors"
              >
                <span><strong>Admin:</strong> admin@certisecure.dev</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('issuer@sms.edu.in', 'Issuer@2026')}
                className="w-full p-2.5 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-800 text-left flex justify-between items-center text-gray-300 transition-colors"
              >
                <span><strong>Issuer:</strong> issuer@sms.edu.in (SMS Lucknow)</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase">Issuer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('student@sms.edu.in', 'Verifier@2026')}
                className="w-full p-2.5 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-800 text-left flex justify-between items-center text-gray-300 transition-colors"
              >
                <span><strong>Student:</strong> student@sms.edu.in</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('verifier@certisecure.dev', 'Verifier@2026')}
                className="w-full p-2.5 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-800 text-left flex justify-between items-center text-gray-300 transition-colors"
              >
                <span><strong>Verifier:</strong> verifier@certisecure.dev</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">Verifier</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
