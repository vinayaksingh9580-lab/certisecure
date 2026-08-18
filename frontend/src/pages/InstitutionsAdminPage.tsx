import { useState, useEffect } from 'react';
import { Building2, Plus, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { institutionApi } from '../services/api';
import type { Institution } from '../types';

export default function InstitutionsAdminPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInstitutions();
  }, []);

  async function loadInstitutions() {
    setLoading(true);
    try {
      const data = await institutionApi.list();
      setInstitutions(data.institutions);
    } catch (err) {
      console.error('Failed to load institutions:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await institutionApi.create({ name, code, domain, description });
      setShowAddModal(false);
      setName('');
      setCode('');
      setDomain('');
      setDescription('');
      loadInstitutions();
    } catch (err: any) {
      alert('Failed to register issuer: ' + (err.response?.data?.detail || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id: number) => {
    try {
      await institutionApi.verify(id);
      loadInstitutions();
    } catch (err) {
      alert('Failed to verify institution.');
    }
  };

  const handleSuspend = async (id: number) => {
    if (!confirm('Are you sure you want to suspend this institution? Certificates will fail trust check.')) return;
    try {
      await institutionApi.suspend(id);
      loadInstitutions();
    } catch (err) {
      alert('Failed to suspend institution.');
    }
  };

  const handleRotateKey = async (id: number) => {
    if (!confirm('Rotate Ed25519 cryptographic keypair? Existing certificates will remain verifiable with historical public key.')) return;
    try {
      const res = await institutionApi.rotateKeys(id);
      alert(`Keys rotated successfully! New Key ID: ${res.new_key_id}`);
      loadInstitutions();
    } catch (err) {
      alert('Failed to rotate keys.');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            Issuer Registry Management
          </h1>
          <p className="text-sm text-gray-400">Register institutions, generate Ed25519 signing keys, and manage trust status</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Register New Issuer
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/80 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Issuer Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Domain</th>
                  <th className="p-4">Trust Status</th>
                  <th className="p-4 text-right">Key Management & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-semibold text-white">{inst.name}</td>
                    <td className="p-4 font-mono text-xs text-cyan-400">{inst.code}</td>
                    <td className="p-4 text-gray-400">{inst.domain || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inst.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {inst.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRotateKey(inst.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium flex items-center gap-1"
                          title="Rotate Ed25519 Keypair"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                          Rotate Keys
                        </button>

                        {inst.status !== 'verified' && (
                          <button
                            onClick={() => handleVerify(inst.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verify
                          </button>
                        )}

                        {inst.status !== 'suspended' && (
                          <button
                            onClick={() => handleSuspend(inst.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-medium flex items-center gap-1"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                            Suspend
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Register Educational Institution</h3>
            <p className="text-xs text-gray-400 mb-4">Automatically generates active Ed25519 signing key pair.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Institution Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SMS Lucknow"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Unique Issuer Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SMS-LKO"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-400 uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Domain (Optional)</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="sms.edu.in"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Premier technical & management institute..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20"
                >
                  {submitting ? 'Registering...' : 'Register & Generate Keys'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
