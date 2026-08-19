import { Link } from 'react-router-dom';
import { GraduationCap, Building2, Search, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LoginPage() {
  return (
    <div className="min-h-screen text-gray-100 flex flex-col bg-[URL('./dash.png')] relative overflow-hidden">
      <Navbar />

      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Select Login Type</h1>
          <p className="text-gray-400 text-lg">Choose your role to access the CertiSecure2 platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
          {/* Student Portal */}
          <Link
            to="/student/login"
            className="group glass-panel p-8 rounded-2xl border border-gray-800 hover:border-amber-500/50 hover:bg-gray-800/60 transition-all duration-300 relative overflow-hidden shadow-2xl hover:shadow-amber-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-6 border border-amber-500/30 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Student Portal</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Access and view your digital certificates issued by institutions.
            </p>
          </Link>

          {/* Institution / Issuer */}
          <Link
            to="/issuer/login"
            className="group glass-panel p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/60 transition-all duration-300 relative overflow-hidden shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Institution / Issuer</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Issue, manage, and revoke digital certificates for your organization.
            </p>
          </Link>

          {/* Verifier */}
          <Link
            to="/verifier/login"
            className="group glass-panel p-8 rounded-2xl border border-gray-800 hover:border-emerald-500/50 hover:bg-gray-800/60 transition-all duration-300 relative overflow-hidden shadow-2xl hover:shadow-emerald-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Verifier</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Corporate portal to verify the authenticity of candidate certificates.
            </p>
          </Link>

          {/* System Admin */}
          <Link
            to="/admin/login"
            className="group glass-panel p-8 rounded-2xl border border-gray-800 hover:border-purple-500/50 hover:bg-gray-800/60 transition-all duration-300 relative overflow-hidden shadow-2xl hover:shadow-purple-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">System Admin</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Manage platform settings, institutions, and overarching security.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
