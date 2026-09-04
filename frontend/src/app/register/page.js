'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../utils/api';
import { translations, getStoredLang } from '../../utils/translations';
import { UserCheck, AlertCircle, ArrowLeft, Landmark, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function FarmerRegisterPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    village: '',
    district: '',
    state: 'Madhya Pradesh',
    accountNumber: '',
    ifsc: '',
    accountHolder: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLang(getStoredLang());
    const handleLangChange = () => setLang(getStoredLang());
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        password: formData.password,
        village: formData.village,
        district: formData.district,
        state: formData.state,
        bankAccount: {
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc.toUpperCase(),
          accountHolder: formData.accountHolder || formData.name,
        },
      };

      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.token) {
        localStorage.setItem('sih_token', res.token);
        localStorage.setItem('sih_user', JSON.stringify(res.user));
        window.dispatchEvent(new Event('authChange'));
        router.push('/centres');
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'पंजीयन असफल रहा। कृपया प्रविष्टि पुनः जांचें।' : 'Registration failed. Please review your information.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] py-8 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-950 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? '← मुख्य पृष्ठ पर वापस जाएं' : '← Back to Home Gateway'}</span>
        </Link>

        {/* Official Registration Form Container */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-xl overflow-hidden">
          {/* Government Form Header */}
          <div className="bg-blue-950 text-white p-6 border-b-4 border-amber-500">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide block">
              {t.ministryName} | {t.govtOfIndia}
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {t.regTitle}
            </h1>
            <p className="text-xs text-blue-200 mt-1">
              {t.regSubtitle}
            </p>
          </div>

          {error && (
            <div className="m-6 mb-0 p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Section 1: Personal Details */}
            <div>
              <h2 className="text-xs font-black text-blue-950 uppercase tracking-wider pb-2 border-b-2 border-slate-200 mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>{t.personalSection}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.farmerNameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t.farmerNamePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.mobileLabel} *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder={t.mobilePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t.emailPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.villageLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    placeholder={t.villagePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.districtLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder={t.districtPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-950"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: DBT Bank Account */}
            <div>
              <h2 className="text-xs font-black text-blue-950 uppercase tracking-wider pb-2 border-b-2 border-slate-200 mb-2 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span>{t.bankSection}</span>
              </h2>

              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 mb-4 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{t.bankNotice}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.accountNumberLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder={t.accountNumberPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t.ifscLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    name="ifsc"
                    value={formData.ifsc}
                    onChange={handleChange}
                    placeholder={t.ifscPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {lang === 'hi' ? 'खाताधारक का नाम (बैंक पासबुक अनुसार)' : 'Account Holder Name (as per passbook)'}
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={formData.accountHolder}
                    onChange={handleChange}
                    placeholder={formData.name || (lang === 'hi' ? 'उदा. रमेश चंद्र शर्मा' : 'e.g. Ramesh Chandra Sharma')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Password */}
            <div>
              <h2 className="text-xs font-black text-blue-950 uppercase tracking-wider pb-2 border-b-2 border-slate-200 mb-4">
                {t.securitySection}
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.passwordRegLabel} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-950"
                />
              </div>
            </div>

            {/* Declaration & Submit */}
            <div className="pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 leading-relaxed mb-4">
                {t.regAgreeText}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? '...' : `✓ ${t.regSubmitBtn}`}
              </button>
            </div>
          </form>

          <div className="bg-slate-50 border-t border-slate-200 p-4 text-center text-xs text-slate-600">
            <span>{t.alreadyRegistered} </span>
            <Link href="/" className="font-extrabold text-blue-950 hover:underline">
              {t.signInHere} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
