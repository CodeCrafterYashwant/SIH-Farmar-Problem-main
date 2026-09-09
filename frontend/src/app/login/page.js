'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../utils/api';
import { LogIn, AlertCircle, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Role Mismatch Modal
  const [roleMismatchModal, setRoleMismatchModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetSection: '', // 'staff' | 'admin'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      if (res.user && res.user.role !== 'farmer') {
        const isAdm = res.user.role === 'admin';
        setRoleMismatchModal({
          isOpen: true,
          title: 'Incorrect Login Section',
          message: isAdm 
            ? 'This account belongs to Administrator. Please login using the Admin section only.'
            : 'This account belongs to Mandi Staff. Please login using the Staff section only.',
          targetSection: isAdm ? 'admin' : 'staff',
        });
        return;
      }

      if (res.token) {
        localStorage.setItem('sih_token', res.token);
        localStorage.setItem('sih_user', JSON.stringify(res.user));
        router.push('/my-bookings');
      }
    } catch (err) {
      if (err.message && (err.message.includes('Mandi Staff') || err.message.includes('USE_STAFF_SECTION') || err.message.includes('Staff section'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: 'Incorrect Login Section',
          message: 'This account belongs to Mandi Staff. Please login using the Staff section only.',
          targetSection: 'staff',
        });
      } else if (err.message && (err.message.includes('Administrator') || err.message.includes('USE_ADMIN_SECTION') || err.message.includes('Admin section'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: 'Incorrect Login Section',
          message: 'This account belongs to Administrator. Please login using the Admin section only.',
          targetSection: 'admin',
        });
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Farmer Sign In</h1>
            <p className="text-xs text-slate-400">Enter your registered mobile or email to access your portal</p>
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number or Email</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 9876543210 or farmer@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="border-t border-slate-800 mt-6 pt-5 flex items-center justify-between text-xs text-slate-400">
          <Link href="/register" className="text-emerald-400 hover:underline">
            Don't have an account? Sign up
          </Link>
          <Link href="/staff/login" className="text-slate-400 hover:text-slate-300">
            Staff Login →
          </Link>
        </div>
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
                  if (roleMismatchModal.targetSection === 'admin') {
                    router.push('/admin/login');
                  } else {
                    router.push('/staff/login');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>{roleMismatchModal.targetSection === 'admin' ? 'Go to Admin Login' : 'Go to Staff Login'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
