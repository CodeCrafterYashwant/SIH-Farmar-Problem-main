'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import { Shield, AlertCircle, Sparkles, ShieldAlert, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Role Mismatch Modal State
  const [roleMismatchModal, setRoleMismatchModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetSection: '', // 'farmer' | 'staff'
  });

  useEffect(() => {
    setLang(getStoredLang());
    const handleLangChange = () => setLang(getStoredLang());
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

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
          expectedRole: 'admin',
        }),
      });

      if (res.user && res.user.role === 'farmer') {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useFarmerNotice,
          targetSection: 'farmer',
        });
        return;
      }

      if (res.user && res.user.role === 'staff') {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useStaffNotice,
          targetSection: 'staff',
        });
        return;
      }

      if (res && res.token) {
        if (res.user.role !== 'admin') {
          throw new Error(lang === 'hi' ? 'पहुंच प्रतिबंधित। केवल प्रशासक अधिकृत हैं।' : 'Access restricted. Admin authorization required.');
        }

        localStorage.setItem('sih_token', res.token);
        localStorage.setItem('sih_user', JSON.stringify(res.user));
        window.dispatchEvent(new Event('authChange'));
        router.push('/admin/dashboard');
      }
    } catch (err) {
      if (err.message && (err.message.includes('Farmer') || err.message.includes('USE_FARMER_SECTION') || err.message.includes('किसान'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useFarmerNotice,
          targetSection: 'farmer',
        });
      } else if (err.message && (err.message.includes('Mandi Staff') || err.message.includes('USE_STAFF_SECTION') || err.message.includes('स्टाफ'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useStaffNotice,
          targetSection: 'staff',
        });
      } else {
        setError(err.message || (lang === 'hi' ? 'प्रशासक प्रमाणीकरण विफल।' : 'Admin authentication failed.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 font-body">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-serif text-white">{t.adminLoginTitle}</h1>
            <p className="text-xs text-slate-400">{t.adminLoginDesc}</p>
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">{t.adminUsernameLabel}</label>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('AdminPass123!');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                <span>{lang === 'hi' ? 'स्वतः भरें (Fill Demo)' : 'Fill Demo'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500 font-data"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.passwordLabel}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="AdminPass123!"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500 font-data"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
            {t.adminDemoHint}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-all shadow-lg shadow-amber-600/30 active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? (lang === 'hi' ? 'प्रमाणीकरण जारी...' : 'Authenticating Admin...') : t.loginBtnAdmin}
          </button>
        </form>
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
                  {t.wrongPortalSub}
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
                {t.closeBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleMismatchModal({ ...roleMismatchModal, isOpen: false });
                  if (roleMismatchModal.targetSection === 'farmer') {
                    router.push('/login');
                  } else {
                    router.push('/staff/login');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>{roleMismatchModal.targetSection === 'farmer' ? t.goToFarmerBtn : t.goToStaffBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
