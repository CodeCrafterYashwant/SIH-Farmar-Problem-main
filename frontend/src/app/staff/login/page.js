'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { ShieldCheck, AlertCircle, LogIn, ShieldAlert, ArrowRight } from 'lucide-react';

export default function StaffLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Role Mismatch Modal
  const [roleMismatchModal, setRoleMismatchModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetSection: '', // 'farmer' | 'admin'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/api/auth/staff-login', {
        method: 'POST',
        body: JSON.stringify({ 
          username: username.trim().toLowerCase(), 
          password,
          expectedRole: 'staff',
        }),
      });

      if (res.user && res.user.role === 'farmer') {
        setRoleMismatchModal({
          isOpen: true,
          title: 'Incorrect Login Section',
          message: 'This account is registered as a Farmer. Please login using the Farmer section only.',
          targetSection: 'farmer',
        });
        return;
      }

      if (res.user && res.user.role === 'admin') {
        setRoleMismatchModal({
          isOpen: true,
          title: 'Incorrect Login Section',
          message: 'This account belongs to Administrator. Please login using the Admin section only.',
          targetSection: 'admin',
        });
        return;
      }

      if (res.token) {
        localStorage.setItem('sih_token', res.token);
        localStorage.setItem('sih_user', JSON.stringify(res.user));
        router.push('/staff/today');
      }
    } catch (err) {
      if (err.message && (err.message.includes('Farmer') || err.message.includes('USE_FARMER_SECTION') || err.message.includes('किसान'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: 'Incorrect Login Section',
          message: 'This account is registered as a Farmer. Please login using the Farmer section only.',
          targetSection: 'farmer',
        });
      } else if (err.message && (err.message.includes('Administrator') || err.message.includes('USE_ADMIN_SECTION'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: 'Incorrect Login Section',
          message: 'This account belongs to Administrator. Please login using the Admin section only.',
          targetSection: 'admin',
        });
      } else {
        setError(err.message || 'Staff login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Staff Verification Desk</h1>
            <p className="text-xs text-slate-400">Official government procurement terminal</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Staff Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ramesh_sehore"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter official password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-all shadow-lg shadow-teal-600/30 active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Verifying Credentials...' : 'Sign In as Officer'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Staff credentials are provisioned by District Mandi Administrators.
        </p>
      </div>

      {/* Role Mismatch Modal Popup */}
      {roleMismatchModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {roleMismatchModal.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Role restriction enforced for portal security.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 mb-5 leading-relaxed">
              {roleMismatchModal.message}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRoleMismatchModal({ ...roleMismatchModal, isOpen: false })}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleMismatchModal({ ...roleMismatchModal, isOpen: false });
                  if (roleMismatchModal.targetSection === 'farmer') {
                    router.push('/login');
                  } else {
                    router.push('/admin/login');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>{roleMismatchModal.targetSection === 'farmer' ? 'Go to Farmer Login' : 'Go to Admin Login'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
