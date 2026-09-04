'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import { 
  Building2, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  MapPin,
  Landmark
} from 'lucide-react';

export default function AdminCentresPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    district: '',
    state: 'मध्य प्रदेश (Madhya Pradesh)',
    wheatRate: '22.75',
    paddyRate: '21.83',
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
    fetchCentres();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  const fetchCentres = async () => {
    try {
      const res = await apiRequest('/api/centres');
      if (res.centres) setCentres(res.centres);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        district: formData.district,
        state: formData.state,
        cropTypesHandled: ['Wheat', 'Paddy', 'Soybean', 'Mustard'],
        ratePerKg: {
          Wheat: Number(formData.wheatRate) || 22.75,
          Paddy: Number(formData.paddyRate) || 21.83,
        },
      };

      const res = await apiRequest('/api/centres', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setMessage(lang === 'hi'
          ? `उपार्जन केंद्र '${res.centre.name}' [${res.centre.code}] सफलतापूर्वक पंजीकृत!`
          : `Procurement Centre '${res.centre.name}' [${res.centre.code}] registered successfully!`);
        setFormData({
          name: '',
          code: '',
          district: '',
          state: 'मध्य प्रदेश (Madhya Pradesh)',
          wheatRate: '22.75',
          paddyRate: '21.83',
        });
        fetchCentres();
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'उपार्जन केंद्र जोड़ने में विफल' : 'Failed to register procurement centre'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-7xl mx-auto">
        {/* Official Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase block">
              {t.govtOfIndia}
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900 mt-1">
              {t.adminCentresHeading}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.adminCentresSub}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-900">
            <Landmark className="w-4 h-4 text-emerald-800" />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Centre Form */}
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>{t.createCentreTitle}</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.centreNameLabel} *</label>
              <input
                type="text"
                required
                placeholder={lang === 'hi' ? 'उदा. सीहोर कृषि उपज मंडी' : 'e.g. Sehore Krishi Upaj Mandi'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-normal text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.centreCodeLabel} *</label>
              <input
                type="text"
                required
                placeholder="e.g. MANDI-SHR-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 uppercase focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.districtLabel} *</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'hi' ? 'उदा. सीहोर' : 'e.g. Sehore'}
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.stateLabel} *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">{t.wheatMspLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.wheatRate}
                  onChange={(e) => setFormData({ ...formData, wheatRate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">{t.paddyMspLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.paddyRate}
                  onChange={(e) => setFormData({ ...formData, paddyRate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors shadow-sm active:scale-95 disabled:opacity-50 mt-2"
            >
              {submitting ? (lang === 'hi' ? 'प्रक्रियाधीन...' : 'Saving...') : t.saveCentreBtn}
            </button>
          </form>

          {/* Active Mandis List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
              <span>{t.activeCentresListTitle} ({centres.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">{lang === 'hi' ? 'समस्त 52 जिले' : 'All 52 Districts'}</span>
            </h2>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs font-medium">
                {lang === 'hi' ? 'उपार्जन केंद्र लोड हो रहे हैं...' : 'Loading mandi centres...'}
              </div>
            ) : centres.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                {lang === 'hi' ? 'अभी तक कोई उपार्जन केंद्र नहीं बनाया गया है।' : 'No procurement centres registered yet.'}
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {centres.map((c) => (
                  <div
                    key={c._id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs interactive-card"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{c.name}</span>
                        <span className="font-data text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {c.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.districtLabel}: {c.district}, {c.state}</span>
                        <span className="text-slate-400">|</span>
                        <span>{t.cropsHandled}: {c.cropTypesHandled?.join(', ') || 'Wheat, Paddy'}</span>
                      </div>
                    </div>

                    <Link
                      href={`/centres/${c._id}/book`}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium text-xs self-end sm:self-auto transition-colors"
                    >
                      {t.viewSlotsLink}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
