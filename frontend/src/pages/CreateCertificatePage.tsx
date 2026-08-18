import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Shield, ArrowLeft, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { certificateApi, STORAGE_BASE } from '../services/api';
import type { Certificate } from '../types';

export default function CreateCertificatePage() {
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [course, setCourse] = useState('');
  const [certificateType, setCertificateType] = useState('Completion');
  const [grade, setGrade] = useState('PASS');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issuedCert, setIssuedCert] = useState<Certificate | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setIssuedCert(null);

    try {
      const cert = await certificateApi.create({
        holder_name: holderName,
        holder_email: holderEmail || undefined,
        roll_number: rollNumber || undefined,
        course,
        certificate_type: certificateType,
        grade: grade || undefined,
        description: description || undefined,
        issue_date: issueDate,
      });
      setIssuedCert(cert);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to issue certificate. Make sure institution signing key exists.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Issue Digitally Signed Certificate</h1>
            <p className="text-sm text-gray-400">Generates Ed25519 signature, SHA-256 canonical hash, PDF & QR code</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {issuedCert ? (
          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/30 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Certificate Successfully Issued!</h2>
            <p className="text-gray-400 text-sm mb-6">
              Unique Certificate UID: <strong className="font-mono text-cyan-400">{issuedCert.certificate_uid}</strong>
            </p>

            <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 mb-6 text-left space-y-2 text-sm text-gray-300 font-mono">
              <div><strong className="text-gray-500">Hash (SHA-256):</strong> <span className="text-xs break-all text-emerald-400">{issuedCert.data_hash}</span></div>
              <div><strong className="text-gray-500">Holder:</strong> {issuedCert.holder_name}</div>
              <div><strong className="text-gray-500">Course:</strong> {issuedCert.course}</div>
              <div><strong className="text-gray-500">Roll/Reg No:</strong> {issuedCert.roll_number || 'N/A'}</div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`${STORAGE_BASE}/${issuedCert.pdf_path}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" />
                Download Signed PDF
              </a>

              <Link
                to={`/verify/${issuedCert.certificate_uid}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Test QR Verification
              </Link>

              <button
                onClick={() => setIssuedCert(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold"
              >
                Issue Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl border border-gray-800 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="e.g. Vinayak Singh"
                  className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Roll / Registration Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. SMS-2026-CS-042"
                  className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Course / Program Title *
                </label>
                <input
                  type="text"
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Certificate Type
                </label>
                <select
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="Completion">Certificate of Completion</option>
                  <option value="Achievement">Certificate of Achievement</option>
                  <option value="Participation">Certificate of Participation</option>
                  <option value="Excellence">Certificate of Excellence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Grade / Result
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. PASS, DISTINCTION, A+"
                  className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Student Email (Optional)
                </label>
                <input
                  type="email"
                  value={holderEmail}
                  onChange={(e) => setHolderEmail(e.target.value)}
                  placeholder="vinayak@student.sms.edu.in"
                  className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Additional Description / Honors
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional honors or specialization details to include in canonical hash..."
                className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FileCheck className="w-5 h-5" />
                  Sign & Issue Certificate
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
