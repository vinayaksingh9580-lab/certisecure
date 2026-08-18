import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, Eye, Download, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { certificateApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Certificate } from '../types';

export default function CertificateListPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Revocation modal state
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('incorrect_information');
  const [revokeDetail, setRevokeDetail] = useState('');
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    loadCerts();
  }, [search, statusFilter]);

  async function loadCerts() {
    setLoading(true);
    try {
      const data = await certificateApi.list({
        search: search || undefined,
        status_filter: statusFilter || undefined,
      });
      setCerts(data.certificates);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUid) return;
    setRevoking(true);
    try {
      await certificateApi.revoke(selectedUid, revokeReason, revokeDetail);
      setSelectedUid(null);
      setRevokeDetail('');
      await loadCerts();
    } catch (err: any) {
      alert('Failed to revoke certificate: ' + (err.response?.data?.detail || 'Server error'));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Certificate Directory</h1>
          <p className="text-sm text-gray-400">View and manage digitally signed certificates</p>
        </div>

        {(user?.role === 'admin' || user?.role === 'issuer') && (
          <Link
            to="/issue"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Issue New Certificate
          </Link>
        )}
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-gray-800 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, course, or UID..."
            className="w-full bg-gray-900 border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 sm:w-48"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="revoked">Revoked Only</option>
        </select>
      </div>

      <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : certs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No certificates found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/80 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Certificate UID</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Roll / Reg No</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {certs.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-cyan-400 font-semibold">{cert.certificate_uid}</td>
                    <td className="p-4 font-medium text-white">{cert.holder_name}</td>
                    <td className="p-4 font-mono text-xs text-gray-400">{cert.roll_number || '—'}</td>
                    <td className="p-4 text-gray-300">{cert.course}</td>
                    <td className="p-4 text-xs text-blue-400 font-medium">{cert.certificate_type}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        cert.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/certificates/${cert.certificate_uid}`}
                          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                          title="View Cryptographic Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {cert.pdf_path && (
                          <a
                            href={`http://localhost:8000/storage/${cert.pdf_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        {cert.status === 'active' && (user?.role === 'admin' || user?.role === 'issuer') && (
                          <button
                            onClick={() => setSelectedUid(cert.certificate_uid)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                            title="Revoke Certificate"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUid && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-red-500/30 max-w-md w-full animate-fadeIn">
            <h3 className="text-lg font-bold text-red-400 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Revoke Certificate
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              Target UID: {selectedUid}
            </p>

            <form onSubmit={handleRevokeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Reason</label>
                <select
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="incorrect_information">Incorrect Information</option>
                  <option value="fraud">Fraudulent Claim</option>
                  <option value="duplicate_issuance">Duplicate Issuance</option>
                  <option value="administrative_error">Administrative Error</option>
                  <option value="other">Other / SIH Demonstration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Details (Optional)</label>
                <textarea
                  rows={2}
                  value={revokeDetail}
                  onChange={(e) => setRevokeDetail(e.target.value)}
                  placeholder="e.g. Test revocation for SIH demonstration"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUid(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revoking}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-600/20 transition-colors"
                >
                  {revoking ? 'Revoking...' : 'Confirm Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
