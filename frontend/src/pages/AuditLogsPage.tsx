import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { auditApi } from '../services/api';
import type { AuditLog } from '../types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const data = await auditApi.list({ action: actionFilter || undefined });
        setLogs(data.logs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [actionFilter]);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            Security Audit Trail
          </h1>
          <p className="text-sm text-gray-400">Immutable record of security events, certificate operations, and verifications</p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 sm:w-64"
        >
          <option value="">All Audit Actions</option>
          <option value="CERT_ISSUED">Certificate Issuance</option>
          <option value="CERT_VERIFIED">Certificate Verification</option>
          <option value="CERT_REVOKED">Certificate Revocation</option>
          <option value="USER_LOGIN">User Authentication</option>
          <option value="INSTITUTION_CREATED">Issuer Registered</option>
        </select>
      </div>

      <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No audit records found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/80 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Resource Type</th>
                  <th className="p-4">Resource ID</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-sans font-semibold text-white">
                      <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 font-sans">{log.resource_type || '—'}</td>
                    <td className="p-4 text-cyan-400">{log.resource_id || '—'}</td>
                    <td className="p-4 text-gray-400">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-4 text-gray-400 font-sans">
                      {new Date(log.created_at).toLocaleString()}
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
