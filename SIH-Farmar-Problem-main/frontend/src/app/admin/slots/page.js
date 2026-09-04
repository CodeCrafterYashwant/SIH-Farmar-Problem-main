'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import { 
  CalendarCheck, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Clock 
} from 'lucide-react';

export default function AdminSlotsPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getFutureStr = (days = 7) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    centreId: '',
    startDate: getTodayStr(),
    endDate: getFutureStr(7),
    maxCapacity: '25',
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
        centreId: formData.centreId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxCapacity: Number(formData.maxCapacity) || 25,
      };

      const res = await apiRequest('/api/slots/generate-batch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setMessage(lang === 'hi'
          ? `सफलतापूर्वक ${res.count} समय स्लॉट सृजित किए गए! किसान अब इन तिथियों पर बुकिंग कर सकते हैं।`
          : `Successfully generated ${res.count} time slots! Farmers can now book appointments.`);
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'स्लॉट सृजन में विफल' : 'Failed to generate slots'));
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
              {t.adminSlotsHeading}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.adminSlotsSub}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-900">
            <Layers className="w-4 h-4 text-emerald-800" />
            <span>4 {lang === 'hi' ? 'दैनिक समय चक्र' : 'Operating Windows'}</span>
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

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              {t.targetMandiLabel} *
            </label>
            <select
              value={formData.centreId}
              onChange={(e) => setFormData({ ...formData, centreId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
            >
              {centres.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code} - {t.districtLabel}: {c.district})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t.startDateLabel} *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t.endDateLabel} *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              {t.maxCapacityLabel} *
            </label>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
            />
            <div className="p-3 mt-2 rounded-xl bg-slate-100 text-[11px] text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>
                {t.slotScheduleNotice}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors shadow-sm active:scale-95 disabled:opacity-50 mt-3"
          >
            {submitting ? (lang === 'hi' ? 'स्लॉट सृजित किए जा रहे हैं...' : 'Generating Slots...') : `✓ ${t.generateSlotsActionBtn}`}
          </button>
        </form>
      </div>
    </div>
  );
}
