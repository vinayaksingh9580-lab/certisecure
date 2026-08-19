import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  Key,
  Building,
  User,
  AlertTriangle,
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import DashboardLayout from '../layouts/DashboardLayout';
import { verifyApi } from '../services/api';
import type { VerificationResult } from '../types';

export default function VerifyPage() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [inputId, setInputId] = useState(certificateId || '');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (certificateId) {
      doVerify(certificateId);
    }
  }, [certificateId]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          let uid = decodedText;
          if (decodedText.includes('/verify/')) {
            uid = decodedText.split('/verify/')[1];
          }
          setInputId(uid);
          setShowScanner(false);
          scanner?.clear();
          navigate(`/verify/${uid}`);
        },
        () => { }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [showScanner, navigate]);

  const doVerify = async (uid: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await verifyApi.verify(uid.trim());
      setResult(data);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment before verifying again.');
      } else {
        setError('Verification service unavailable or server error.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputId.trim()) {
      navigate(`/verify/${inputId.trim()}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Public Verification Endpoint
          </div>
          <h1 className="text-3xl font-extrabold text-white">Instant Certificate Verification</h1>
          <p className="text-gray-400 text-sm mt-1 max-w-lg mx-auto">
            Scan QR code or enter Certificate ID to perform Ed25519 signature & SHA-256 integrity check.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-gray-800 mb-8 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="Enter Certificate ID (e.g. CERT-SMS-LKO-2026-000001)"
                className="w-full bg-gray-900/90 border border-gray-700/80 rounded-xl pl-12 pr-4 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Verify Authenticity
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className="px-4 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-cyan-400 font-semibold text-sm border border-gray-700 flex items-center justify-center gap-2 shrink-0 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              {showScanner ? 'Close Scanner' : 'Scan QR'}
            </button>
          </form>

          {showScanner && (
            <div className="mt-6 p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg" />
              <p className="text-center text-xs text-gray-500 mt-2">Point camera at Certificate QR Code</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center mb-8">
            {error}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6 animate-fadeIn">
            {result.status === 'VALID' && (
              <div className="p-6 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-center relative overflow-hidden shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black tracking-wide text-emerald-400 uppercase">
                  ✓ VERIFIED / AUTHENTIC
                </h2>
                <p className="text-emerald-200/90 text-sm mt-1 max-w-xl mx-auto font-medium">
                  {result.message}
                </p>
              </div>
            )}

            {result.status === 'TAMPERED' && (
              <div className="p-6 rounded-2xl bg-red-500/15 border-2 border-red-500/50 text-center relative overflow-hidden shadow-2xl animate-pulse">
                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3 border border-red-500/40 shadow-lg shadow-red-500/20">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black tracking-wide text-red-400 uppercase">
                  🔴 TAMPER DETECTED / INVALID
                </h2>
                <p className="text-red-200/90 text-sm mt-1 max-w-xl mx-auto font-medium">
                  {result.message}
                </p>
              </div>
            )}

            {result.status === 'REVOKED' && (
              <div className="p-6 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 text-center relative overflow-hidden shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/40 shadow-lg shadow-amber-500/20">
                  <AlertOctagon className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black tracking-wide text-amber-400 uppercase">
                  ⚠️ CERTIFICATE REVOKED
                </h2>
                <p className="text-amber-200/90 text-sm mt-1 max-w-xl mx-auto font-medium">
                  {result.message}
                </p>
              </div>
            )}

            {result.status === 'NOT_FOUND' && (
              <div className="p-6 rounded-2xl bg-gray-800/80 border-2 border-gray-700 text-center">
                <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-300">CERTIFICATE NOT FOUND</h2>
                <p className="text-gray-400 text-sm mt-1">{result.message}</p>
              </div>
            )}

            {result.certificate && (
              <div className="glass-panel p-6 rounded-2xl border border-gray-800">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  Verified Record Details
                </h3>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80">
                    <span className="block text-xs text-gray-500 mb-1">Student Name</span>
                    <span className="font-bold text-white text-base">{result.certificate.holder_name}</span>
                  </div>

                  <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80">
                    <span className="block text-xs text-gray-500 mb-1">Roll / Reg Number</span>
                    <span className="font-bold text-cyan-400 font-mono text-sm">{result.certificate.roll_number || 'N/A'}</span>
                  </div>

                  <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80">
                    <span className="block text-xs text-gray-500 mb-1">Course / Program</span>
                    <span className="font-semibold text-gray-200 text-sm">{result.certificate.course}</span>
                  </div>

                  <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80">
                    <span className="block text-xs text-gray-500 mb-1">Certificate Type</span>
                    <span className="font-semibold text-blue-400 text-sm">{result.certificate.certificate_type}</span>
                  </div>

                  <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80">
                    <span className="block text-xs text-gray-500 mb-1">Result / Grade</span>
                    <span className="font-bold text-emerald-400 text-sm">{result.certificate.grade || 'N/A'}</span>
                  </div>

                  <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80">
                    <span className="block text-xs text-gray-500 mb-1">Issue Date</span>
                    <span className="font-medium text-gray-300 text-sm">
                      {new Date(result.certificate.issue_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {result.crypto && (
              <div className="glass-panel p-6 rounded-2xl border border-gray-800">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  Cryptographic Integrity Breakdown
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-900/70 border border-gray-800">
                    <span className="text-gray-300 font-medium">Digital Signature (Ed25519)</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${result.crypto.signature_valid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                      {result.crypto.signature_valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {result.crypto.signature_valid ? 'VALID SIGNATURE' : 'INVALID SIGNATURE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-900/70 border border-gray-800">
                    <span className="text-gray-300 font-medium">Document Hash Match (SHA-256)</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${result.crypto.hash_match ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                      {result.crypto.hash_match ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {result.crypto.hash_match ? 'HASH MATCH' : 'MISMATCH DETECTED'}
                    </span>
                  </div>

                  {!result.crypto.hash_match && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3 font-mono text-xs">
                      <div>
                        <span className="block text-gray-400 mb-1 font-sans">Original Stored Hash:</span>
                        <span className="text-emerald-400 break-all">{result.crypto.original_hash}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 mb-1 font-sans">Calculated Tampered Hash:</span>
                        <span className="text-red-400 break-all">{result.crypto.current_hash}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.issuer && (
              <div className="glass-panel p-6 rounded-2xl border border-gray-800">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  Issuing Institution Trust Status
                </h3>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                    <span className="block text-xs text-gray-500 mb-1">Institution Name</span>
                    <span className="font-bold text-white">{result.issuer.name} ({result.issuer.code})</span>
                  </div>

                  <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                    <span className="block text-xs text-gray-500 mb-1">Public Key Fingerprint</span>
                    <span className="font-mono text-xs text-cyan-400">{result.issuer.public_key_fingerprint || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {result.revocation && (
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
                <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Revocation Audit Record
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-300">
                  <div><strong>Status:</strong> <span className="text-red-400 font-bold">REVOKED</span></div>
                  <div><strong>Certificate ID:</strong> <span className="font-mono text-cyan-400">{result.certificate?.certificate_uid}</span></div>
                  <div><strong>Student Name:</strong> <span className="text-white font-medium">{result.certificate?.holder_name}</span></div>
                  <div><strong>Issuer:</strong> <span className="text-white font-medium">{result.issuer?.name}</span></div>
                  <div><strong>Revocation Reason:</strong> <span className="text-red-300 font-semibold">{result.revocation.reason.replace(/_/g, ' ')}</span></div>
                  {result.revocation.reason_detail && <div><strong>Details:</strong> {result.revocation.reason_detail}</div>}
                  <div><strong>Revoked By:</strong> <span className="text-gray-200">{result.revocation.revoked_by || 'Issuing Authority'}</span></div>
                  <div><strong>Revocation Date/Time:</strong> <span className="text-gray-300">{new Date(result.revocation.revoked_at).toLocaleString()}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
