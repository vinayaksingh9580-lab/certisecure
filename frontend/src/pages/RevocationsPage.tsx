import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, Eye } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { certificateApi } from '../services/api';
import type { Certificate } from '../types';

export default function RevocationsPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRevoked() {
      try {
        const data = await certificateApi.list({ status_filter: 'revoked' });
        setCerts(data.certificates);
      } catch (err) {
        console.error('Failed to load revoked certificates:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRevoked();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-red-400" />
          Revoked Certificate Registry
        </h1>
        <p className="text-sm text-gray-400">
          Permanently revoked certificates that will trigger RED — CERTIFICATE REVOKED status upon verification.
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : certs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No revoked certificates recorded in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/80 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Certificate UID</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {certs.map((cert) => (
                  <tr key={cert.id} className="hover:bg-red-500/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-red-400 font-semibold">{cert.certificate_uid}</td>
                    <td className="p-4 font-medium text-white">{cert.holder_name}</td>
                    <td className="p-4 text-gray-300">{cert.course}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                        REVOKED
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/certificates/${cert.certificate_uid}`}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 inline-flex items-center gap-1 text-xs"
                      >
                        <Eye className="w-4 h-4" />
                        Inspect
                      </Link>
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
