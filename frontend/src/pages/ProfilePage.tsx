import { Shield, Mail, Calendar, Building, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Account Profile</h1>
          <p className="text-sm text-gray-400">Authenticated user details and cryptographic permissions</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-gray-800 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                Role: {user?.role}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-xs text-gray-500">Email Address</span>
                  <span className="font-medium text-white">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-xs text-gray-500">RBAC Role Privilege</span>
                  <span className="font-medium text-white uppercase">{user?.role} Access</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-xs text-gray-500">Institution ID</span>
                  <span className="font-medium text-white">{user?.institution_id ? `ID #${user.institution_id}` : 'Global System Access'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-xs text-gray-500">Account Created</span>
                  <span className="font-medium text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
