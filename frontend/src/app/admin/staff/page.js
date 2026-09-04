'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound 
} from 'lucide-react';

export default function AdminStaffPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff',
    centreId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLang(getStoredLang());
    const handleLangChange = () => setLang(getStoredLang());
    window.addEventListener('languageChange', handleLangChange);

    const rawUser = localStorage.getItem('sih_user');
    if (!rawUser) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(rawUser);
    if (parsed.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchCentres = async () => {
      try {
        const res = await apiRequest('/api/centres');
        if (res.centres) {
          setCentres(res.centres);
          if (res.centres.length > 0) {
            setFormData((prev) => ({ ...prev, centreId: res.centres[0]._id }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCentres();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        name: formData.name,
        username: formData.username.toLowerCase(),
        password: formData.password,
        role: formData.role,
        centreId: formData.role === 'staff' ? formData.centreId : undefined,
      };

      const res = await apiRequest('/api/staff', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setMessage(lang === 'hi'
          ? `मंडी स्टाफ खाता '${res.staff.name}' (${res.staff.username}) सफलतापूर्वक सृजित!`
          : `Staff account '${res.staff.name}' (${res.staff.username}) provisioned successfully!`);
        setFormData({
          name: '',
          username: '',
          password: '',
          role: 'staff',
          centreId: centres[0]?._id || '',
        });
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'स्टाफ खाता बनाने में विफल' : 'Failed to provision staff account'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-4xl mx-auto">
        {/* Official Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase block">
              {t.govtOfIndia}
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900 mt-1">
              {t.adminStaffHeading}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.adminStaffSub}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>{t.adminRoleBadge}</span>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2.5 text-emerald-900 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 mb-6 flex items-start gap-2.5">
          <KeyRound className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <span className="font-semibold block">{t.staffNoticeHeading}</span>
            {t.staffDisclaimer}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t.officerNameLabel} *</label>
              <input
                type="text"
                required
                placeholder={lang === 'hi' ? 'उदा. रमेश कुमार शर्मा' : 'e.g. Ramesh Kumar Sharma'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t.officerUsernameLabel} *</label>
              <input
                type="text"
                required
                placeholder="e.g. ramesh_sehore"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 lowercase focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t.officerPasswordLabel} *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder={lang === 'hi' ? 'कम से कम 6 अक्षर' : 'At least 6 characters'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t.officerRoleLabel} *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="staff">{lang === 'hi' ? 'उपार्जन स्टाफ (गेट सत्यापन व तौल कांटा ऑपरेटर)' : 'Mandi Staff (Gate & Weighbridge Desk)'}</option>
                <option value="admin">{lang === 'hi' ? 'जिला/राज्य प्रशासक (Admin Control)' : 'District/State Admin (HQ Control)'}</option>
              </select>
            </div>
          </div>

          {formData.role === 'staff' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t.assignedMandiLabel} *</label>
              <select
                value={formData.centreId}
                onChange={(e) => setFormData({ ...formData, centreId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                {centres.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code} - {t.districtLabel}: {c.district})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors shadow-sm active:scale-95 disabled:opacity-50 mt-4"
          >
            {submitting ? (lang === 'hi' ? 'खाता बनाया जा रहा है...' : 'Provisioning...') : `✓ ${t.provisionStaffBtn}`}
          </button>
        </form>
      </div>
    </div>
  );
}
