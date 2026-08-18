import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  FileX,
  Search,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { certificateApi } from '../services/api';
import type { DashboardStats, Certificate } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCerts, setRecentCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const isStudentView = user?.role === 'verifier';

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, certsData] = await Promise.all([
          certificateApi.stats(),
          certificateApi.list({ limit: 5 }),
        ]);
        setStats(statsData);
        setRecentCerts(certsData.certificates);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!isStudentView) {
      loadData();
      return;
    }

    setLoading(true);
    certificateApi.list({ limit: 5 })
      .then((certsData) => setRecentCerts(certsData.certificates))
      .catch((err) => console.error('Failed to load student certificates:', err))
      .finally(() => setLoading(false));
  }, [isStudentView]);

  const chartData = [
    { name: 'Active', count: stats?.active_certificates || 0, color: '#10b981' },
    { name: 'Revoked', count: stats?.revoked_certificates || 0, color: '#ef4444' },
  ];

  const verificationData = [
    { name: 'Successful', count: Math.max((stats?.total_verifications || 0) - (stats?.tampering_attempts || 0), 0) },
    { name: 'Tampered/Failed', count: stats?.tampering_attempts || 0 },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Welcome back, {user?.full_name}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold uppercase tracking-wider">
              {user?.role}
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isStudentView
              ? 'Your certificate access summary.'
              : 'CertiSecure2 Real-Time Cryptographic Certificate Operations'}
          </p>
        </div>

        {!isStudentView && (
          <div className="flex items-center gap-3">
            {(user?.role === 'admin' || user?.role === 'issuer') && (
              <Link
                to="/issue"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Issue New Certificate
              </Link>
            )}

            <Link
              to="/verify"
              className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold border border-gray-700 flex items-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" />
              Verify ID
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {!isStudentView && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="glass-panel p-6 rounded-2xl border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Issued</span>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white">{stats?.total_certificates || 0}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    Digitally Signed & Hash-Backed
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active</span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-400">{stats?.active_certificates || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Authentic & Valid</div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Revoked</span>
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                      <FileX className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-red-400">{stats?.revoked_certificates || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Invalidated Records</div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tamper Attempts</span>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-amber-400">{stats?.tampering_attempts || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Blocked by Signature Check</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <div className="glass-panel p-6 rounded-2xl border border-gray-800">
                  <h2 className="text-lg font-bold text-white mb-4">Certificate Distribution</h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem' }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-gray-800">
                  <h2 className="text-lg font-bold text-white mb-4">Verification Audit Results</h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={verificationData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          <Cell fill="#06b6d4" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800/80 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{isStudentView ? 'Your Recent Certificates' : 'Recent Certificates'}</h2>
              {!isStudentView && (
                <Link to="/certificates" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-900/60 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Certificate UID</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {recentCerts.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-mono text-xs text-cyan-400 font-semibold">{cert.certificate_uid}</td>
                      <td className="p-4 font-medium text-white">{cert.holder_name}</td>
                      <td className="p-4 text-gray-400">{cert.course}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                          cert.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          to={`/certificates/${cert.certificate_uid}`}
                          className="text-xs text-blue-400 hover:underline font-medium"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
