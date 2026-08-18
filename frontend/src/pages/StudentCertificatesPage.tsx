import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Search, GraduationCap } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { certificateApi, STORAGE_BASE } from '../services/api';
import type { Certificate } from '../types';

export default function StudentCertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCertificates() {
      setLoading(true);
      try {
        const data = await certificateApi.list({
          search: search || undefined,
        });
        setCerts(data.certificates);
      } catch (err) {
        console.error('Failed to load student certificates:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCertificates();
  }, [search]);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
            My Certificates
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {user?.full_name || 'Student'} — view and download your issued certificate(s).
          </p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-gray-800 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course, certificate UID, or name..."
            className="w-full bg-gray-900 border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : certs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No certificates are available for your account yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/80 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Certificate UID</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {certs.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-emerald-400 font-semibold">{cert.certificate_uid}</td>
                    <td className="p-4 text-white">{cert.course}</td>
                    <td className="p-4 text-xs text-blue-400 font-medium">{cert.certificate_type}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        cert.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/certificates/${cert.certificate_uid}`}
                          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                          title="View Certificate"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {cert.pdf_path && (
                          <a
                            href={`${STORAGE_BASE}/${cert.pdf_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
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
    </DashboardLayout>
  );
}
