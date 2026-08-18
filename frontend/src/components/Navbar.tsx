import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogOut, User as UserIcon, LayoutDashboard, Search, Building2, FileCheck, History, Menu, X, GraduationCap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-panel sticky top-0 z-50 px-4 lg:px-8 py-3.5 border-b border-gray-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              CertiSecure<span className="text-cyan-400 font-extrabold">2</span>
            </span>
            <span className="block text-[10px] tracking-widest text-cyan-400/80 uppercase font-semibold">
              SIH 2026 Cryptographic Core
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/verify"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/verify') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            Verify Certificate
          </Link>

          {!isAuthenticated && (
            <Link
              to="/student/register"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-300 hover:text-white transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              Student Access
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {(user?.role === 'admin' || user?.role === 'issuer') && (
                <Link
                  to="/issue"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/issue') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  Issue Certificate
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/issuers"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/issuers') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Issuer Registry
                </Link>
              )}

              <Link
                to="/audit"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/audit') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                Audit Logs
              </Link>

              {user?.role === 'verifier' && (
                <Link
                  to="/student/certificates"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/student/certificates') ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  My Certificates
                </Link>
              )}
            </>
          ) : null}
        </div>

        {/* User Profile / Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-3 border-l border-gray-800">
              <Link
                to={user?.role === 'verifier' ? '/student/certificates' : '/profile'}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-sm font-medium text-gray-200 border border-gray-700/50"
              >
                <UserIcon className="w-4 h-4 text-cyan-400" />
                <span>{user?.full_name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold uppercase">
                  {user?.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/student/register"
                className="px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-600/30 transition-colors"
              >
                Student Register
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-3 border-t border-gray-800 mt-3 space-y-2">
          <Link
            to="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-800"
          >
            Verify Certificate
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-800"
              >
                Dashboard
              </Link>
              {(user?.role === 'admin' || user?.role === 'issuer') && (
                <Link
                  to="/issue"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-800"
                >
                  Issue Certificate
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/issuers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-800"
                >
                  Issuer Registry
                </Link>
              )}
              {user?.role === 'verifier' && (
                <Link
                  to="/student/certificates"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-300 hover:bg-gray-800"
                >
                  My Certificates
                </Link>
              )}
              <Link
                to="/audit"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-800"
              >
                Audit Logs
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-gray-800"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/student/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-300 hover:bg-gray-800"
              >
                Student Register
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-400 hover:bg-gray-800"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
