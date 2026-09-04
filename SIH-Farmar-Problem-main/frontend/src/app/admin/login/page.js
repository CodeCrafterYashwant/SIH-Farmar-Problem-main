'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import { Shield, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      let res;
      try {
        res = await apiRequest('/api/auth/staff-login', {
          method: 'POST',
          body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
        });
      } catch (err1) {
        res = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: username.trim().toLowerCase(), password }),
        });
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
      setError(err.message || (lang === 'hi' ? 'प्रशासक प्रमाणीकरण विफल।' : 'Admin authentication failed.'));
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
    </div>
  );
}
