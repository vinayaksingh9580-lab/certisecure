import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Shield, Key, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { certificateApi, STORAGE_BASE } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { CertificateDetail } from '../types';

export default function CertificateDetailPage() {
  const { certificateId } = useParams();
  const { user } = useAuth();
  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Revoke state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('incorrect_information');
  const [revokeDetail, setRevokeDetail] = useState('');
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    async function loadCert() {
      if (!certificateId) return;
      try {
        const data = await certificateApi.get(certificateId);
        setCert(data);
      } catch (err: any) {
        setError('Certificate not found or access denied.');
      } finally {
        setLoading(false);
      }
    }
    loadCert();
  }, [certificateId]);

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cert) return;
    setRevoking(true);
    try {
      await certificateApi.revoke(cert.certificate_uid, revokeReason, revokeDetail);
      setShowRevokeModal(false);
      const updated = await certificateApi.get(cert.certificate_uid);
      setCert(updated);
    } catch (err: any) {
      alert('Failed to revoke certificate: ' + (err.response?.data?.detail || 'Server error'));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/certificates" className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">{certificateId}</h1>
              <p className="text-sm text-gray-400">CertiSecure2 Cryptographic Detail View</p>
            </div>
          </div>

          {cert && cert.status === 'active' && (user?.role === 'admin' || user?.role === 'issuer') && (
            <button
              onClick={() => setShowRevokeModal(true)}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Revoke Certificate
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
            {error}
          </div>
        ) : cert ? (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  cert.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  Status: {cert.status}
                </span>
                <h2 className="text-xl font-bold text-white mt-2">{cert.holder_name}</h2>
                <p className="text-sm text-gray-400">{cert.course}</p>
              </div>

              <div className="flex items-center gap-3">
                {cert.pdf_path && (
                  <a
                    href={`${STORAGE_BASE}/${cert.pdf_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                )}

                <Link
                  to={`/verify/${cert.certificate_uid}`}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-sm border border-gray-700 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Public Verify Link
                </Link>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-gray-800">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Certificate Metadata</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                  <span className="block text-xs text-gray-500">Student Name</span>
                  <span className="font-semibold text-white">{cert.holder_name}</span>
                </div>
                <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                  <span className="block text-xs text-gray-500">Roll / Reg Number</span>
                  <span className="font-mono text-cyan-400 text-xs">{cert.roll_number || 'N/A'}</span>
                </div>
                <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                  <span className="block text-xs text-gray-500">Course / Program</span>
                  <span className="font-semibold text-gray-200">{cert.course}</span>
                </div>
                <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                  <span className="block text-xs text-gray-500">Certificate Type</span>
                  <span className="font-semibold text-blue-400">{cert.certificate_type}</span>
                </div>
                <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                  <span className="block text-xs text-gray-500">Grade / Result</span>
                  <span className="font-bold text-emerald-400">{cert.grade || 'N/A'}</span>
                </div>
                <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                  <span className="block text-xs text-gray-500">Issuing Institution</span>
                  <span className="font-semibold text-white">{cert.institution_name} ({cert.institution_code})</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4 font-mono text-xs">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                Raw Cryptographic Proof
              </h3>

              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <span className="block text-gray-500 mb-1 font-sans">Deterministic Canonical JSON:</span>
                <span className="text-cyan-300 break-all">{cert.canonical_data}</span>
              </div>

              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <span className="block text-gray-500 mb-1 font-sans">SHA-256 Digest:</span>
                <span className="text-emerald-400 break-all">{cert.data_hash}</span>
              </div>

              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <span className="block text-gray-500 mb-1 font-sans">Base64 Ed25519 Signature:</span>
                <span className="text-purple-300 break-all">{cert.signature}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showRevokeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-red-500/30 max-w-md w-full">
            <h3 className="text-lg font-bold text-red-400 mb-2">Revoke Certificate</h3>
            <p className="text-xs text-gray-400 mb-4">
              This action is permanent and creates an immutable revocation audit log entry.
            </p>

            <form onSubmit={handleRevoke} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Reason</label>
                <select
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="incorrect_information">Incorrect Information</option>
                  <option value="fraud">Fraudulent Claim</option>
                  <option value="duplicate_issuance">Duplicate Issuance</option>
                  <option value="administrative_error">Administrative Error</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Details (Optional)</label>
                <textarea
                  rows={2}
                  value={revokeDetail}
                  onChange={(e) => setRevokeDetail(e.target.value)}
                  placeholder="Provide context for revocation..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revoking}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
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
