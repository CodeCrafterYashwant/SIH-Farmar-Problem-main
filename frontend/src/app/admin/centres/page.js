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
  Landmark,
  Trash2,
  Edit3,
  X,
  Coins,
  Star,
  MessageSquare
} from 'lucide-react';

export default function AdminCentresPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registration Form State (with all 4 crops)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    district: '',
    state: 'मध्य प्रदेश (Madhya Pradesh)',
    wheatRate: '22.75',
    paddyRate: '21.83',
    soybeanRate: '46.00',
    mustardRate: '56.50',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Delete Mandi Modal State
  const [deletingCentre, setDeletingCentre] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit MSP Modal State
  const [editingCentre, setEditingCentre] = useState(null);
  const [editRates, setEditRates] = useState({
    wheat: '22.75',
    paddy: '21.83',
    soybean: '46.00',
    mustard: '56.50',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Admin Reviews & Feedback Modal State
  const [adminReviewsCentre, setAdminReviewsCentre] = useState(null);
  const [adminReviewsLoading, setAdminReviewsLoading] = useState(false);
  const [adminReviewsData, setAdminReviewsData] = useState(null);

  const openAdminReviewsModal = async (centre) => {
    setAdminReviewsCentre(centre);
    setAdminReviewsLoading(true);
    setAdminReviewsData(null);
    try {
      const res = await apiRequest(`/api/reviews/centre/${centre._id}`);
      if (res.success) {
        setAdminReviewsData(res);
      }
    } catch (err) {
      console.error('Failed to load reviews for admin:', err);
    } finally {
      setAdminReviewsLoading(false);
    }
  };

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
          Soybean: Number(formData.soybeanRate) || 46.00,
          Mustard: Number(formData.mustardRate) || 56.50,
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
          soybeanRate: '46.00',
          mustardRate: '56.50',
        });
        fetchCentres();
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'उपार्जन केंद्र जोड़ने में विफल' : 'Failed to register procurement centre'));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Centre
  const handleDeleteCentre = async () => {
    if (!deletingCentre) return;
    setDeleteLoading(true);
    try {
      const res = await apiRequest(`/api/centres/${deletingCentre._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setMessage(lang === 'hi'
          ? `मंडी केंद्र '${deletingCentre.name}' सफलतापूर्वक हटा दिया गया।`
          : `Procurement Centre '${deletingCentre.name}' deleted successfully.`);
        setDeletingCentre(null);
        fetchCentres();
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'मंडी हटाने में विफल' : 'Failed to delete procurement centre'));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open Edit MSP Modal
  const openEditModal = (centre) => {
    const rates = centre.ratePerKg || {};
    setEditingCentre(centre);
    setEditRates({
      wheat: rates.Wheat || rates.wheat || '22.75',
      paddy: rates.Paddy || rates.paddy || '21.83',
      soybean: rates.Soybean || rates.soybean || '46.00',
      mustard: rates.Mustard || rates.mustard || '56.50',
    });
  };

  // Submit Edit MSP
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCentre) return;
    setEditSubmitting(true);
    try {
      const payload = {
        ratePerKg: {
          Wheat: Number(editRates.wheat) || 22.75,
          Paddy: Number(editRates.paddy) || 21.83,
          Soybean: Number(editRates.soybean) || 46.00,
          Mustard: Number(editRates.mustard) || 56.50,
        },
        cropTypesHandled: ['Wheat', 'Paddy', 'Soybean', 'Mustard'],
      };

      const res = await apiRequest(`/api/centres/${editingCentre._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sih_latest_msp', JSON.stringify({ ...payload.ratePerKg, centreId: editingCentre._id, updatedCentre: res.centre, timestamp: Date.now() }));
          try {
            const raw = localStorage.getItem('sih_user');
            if (raw) {
              const u = JSON.parse(raw);
              const uCentreId = u.centreId?._id || u.centreId;
              if (String(uCentreId) === String(editingCentre._id)) {
                u.centreId = res.centre || { ...u.centreId, ratePerKg: payload.ratePerKg };
                localStorage.setItem('sih_user', JSON.stringify(u));
              }
            }
          } catch (_) {}
          window.dispatchEvent(new CustomEvent('centreMspUpdated', { detail: { centreId: editingCentre._id, ratePerKg: payload.ratePerKg, centre: res.centre } }));
        }
        setMessage(lang === 'hi'
          ? `मंडी '${editingCentre.name}' हेतु सभी 4 फसलों के न्यूनतम समर्थन मूल्य (MSP) अद्यतित किए गए!`
          : `MSP rates for all 4 crops updated successfully for '${editingCentre.name}'!`);
        setEditingCentre(null);
        fetchCentres();
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'समर्थन मूल्य अद्यतन विफल' : 'Failed to update MSP rates'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const getCropRate = (centre, cropName) => {
    if (!centre?.ratePerKg) return null;
    return centre.ratePerKg[cropName] || (centre.ratePerKg.get && centre.ratePerKg.get(cropName)) || null;
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
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-2.5 text-emerald-900 text-xs font-semibold">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
              <span>{message}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2.5 text-rose-800 text-xs font-semibold">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Centre Form with 4 Crop MSP rates */}
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 h-fit">
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

            {/* 4 Crops MSP Inputs */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 mb-2.5">
                <Coins className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === 'hi' ? '4 फसलों का न्यूनतम समर्थन मूल्य (MSP)' : 'MSP Rates for All 4 Crops'}</span>
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">{t.wheatMspLabel}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
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
                    required
                    value={formData.paddyRate}
                    onChange={(e) => setFormData({ ...formData, paddyRate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">{t.soybeanMspLabel}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.soybeanRate}
                    onChange={(e) => setFormData({ ...formData, soybeanRate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">{t.mustardMspLabel}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.mustardRate}
                    onChange={(e) => setFormData({ ...formData, mustardRate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
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
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {centres.map((c) => {
                  const wheatRate = getCropRate(c, 'Wheat') || '22.75';
                  const paddyRate = getCropRate(c, 'Paddy') || '21.83';
                  const soybeanRate = getCropRate(c, 'Soybean') || '46.00';
                  const mustardRate = getCropRate(c, 'Mustard') || '56.50';

                  return (
                    <div
                      key={c._id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3 text-xs interactive-card transition-all hover:border-slate-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 text-sm">{c.name}</span>
                            <span className="font-data text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {c.code}
                            </span>
                            {c.totalReviews > 0 ? (
                              <button
                                type="button"
                                onClick={() => openAdminReviewsModal(c)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-data font-bold text-[10px] hover:bg-amber-100 transition-colors shadow-2xs"
                              >
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                <span>{c.averageRating?.toFixed(1)}</span>
                                <span className="text-amber-800 font-normal">({c.totalReviews} {lang === 'hi' ? 'समीक्षाएं' : 'reviews'})</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ★ {lang === 'hi' ? 'कोई रेटिंग नहीं' : 'No ratings'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{t.districtLabel}: {c.district}, {c.state}</span>
                          </div>
                        </div>

                        {/* Action buttons: View Slots, Edit MSP, Feedback, Delete Mandi */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <Link
                            href={`/centres/${c._id}/book`}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium text-[11px] transition-colors"
                          >
                            {t.viewSlotsLink}
                          </Link>

                          <button
                            type="button"
                            onClick={() => openAdminReviewsModal(c)}
                            title={lang === 'hi' ? 'किसान समीक्षाएं व फीडबैक मॉनिटर करें' : 'Monitor Farmer Reviews & Feedback'}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-950 font-medium text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{lang === 'hi' ? 'फीडबैक' : 'Feedback'}</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            title={t.editMspBtn}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-medium text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{t.editMspBtn}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCentre(c)}
                            title={t.deleteCentreBtn}
                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 4 Crops MSP Display Pills */}
                      <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase text-slate-500 mr-1">
                          {lang === 'hi' ? 'समर्थन मूल्य (4 फसलें):' : 'MSP Rates (4 Crops):'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-300 text-[11px] text-slate-800">
                          <span className="text-slate-600">{lang === 'hi' ? 'गेहूं:' : 'Wheat:'}</span>
                          <strong className="font-data font-semibold text-emerald-900">₹{wheatRate}/kg</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-300 text-[11px] text-slate-800">
                          <span className="text-slate-600">{lang === 'hi' ? 'धान:' : 'Paddy:'}</span>
                          <strong className="font-data font-semibold text-emerald-900">₹{paddyRate}/kg</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-300 text-[11px] text-slate-800">
                          <span className="text-slate-600">{lang === 'hi' ? 'सोयाबीन:' : 'Soybean:'}</span>
                          <strong className="font-data font-semibold text-emerald-900">₹{soybeanRate}/kg</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-300 text-[11px] text-slate-800">
                          <span className="text-slate-600">{lang === 'hi' ? 'सरसों:' : 'Mustard:'}</span>
                          <strong className="font-data font-semibold text-emerald-900">₹{mustardRate}/kg</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit MSP Rates Modal */}
      {editingCentre && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {lang === 'hi' ? 'न्यूनतम समर्थन मूल्य (MSP) अद्यतन करें' : 'Update MSP Rates (All 4 Crops)'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingCentre.name} ({editingCentre.code})
                </p>
              </div>
              <button
                onClick={() => setEditingCentre(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.wheatMspLabel} *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editRates.wheat}
                    onChange={(e) => setEditRates({ ...editRates, wheat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.paddyMspLabel} *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editRates.paddy}
                    onChange={(e) => setEditRates({ ...editRates, paddy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.soybeanMspLabel} *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editRates.soybean}
                    onChange={(e) => setEditRates({ ...editRates, soybean: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.mustardMspLabel} *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editRates.mustard}
                    onChange={(e) => setEditRates({ ...editRates, mustard: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCentre(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {editSubmitting ? (lang === 'hi' ? 'सुरक्षित हो रहा है...' : 'Saving...') : t.saveRatesBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Mandi Confirmation Modal */}
      {deletingCentre && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'hi' ? 'उपार्जन केंद्र हटाएं?' : 'Delete Procurement Mandi?'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-2 leading-relaxed">
              {t.confirmDeleteCentre}
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-5">
              <p className="font-semibold text-slate-900">{deletingCentre.name}</p>
              <p className="text-slate-500 font-data text-[11px] mt-0.5">Code: {deletingCentre.code} | {deletingCentre.district}</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingCentre(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteCentre}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {deleteLoading ? (lang === 'hi' ? 'हटाया जा रहा है...' : 'Deleting...') : t.deleteCentreBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* District Admin: Mandi Rating & Farmer Feedback Modal */}
      {adminReviewsCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-50 p-4 px-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {lang === 'hi' ? 'जिला प्रशासन उपार्जन गुणवत्ता मॉनिटरिंग' : 'District Administration Mandi Quality Monitoring'}
                </span>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  {adminReviewsCentre.name} ({adminReviewsCentre.code})
                </h3>
                <span className="text-xs text-slate-500">
                  {adminReviewsCentre.district}, {adminReviewsCentre.state}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAdminReviewsCentre(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {adminReviewsLoading ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="w-7 h-7 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-xs font-bold">{lang === 'hi' ? 'किसान समीक्षाएं लोड हो रही हैं...' : 'Loading farmer feedback...'}</span>
                </div>
              ) : adminReviewsData ? (
                <>
                  {/* Rating Overview */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-6">
                    <div className="text-center shrink-0">
                      <span className="font-data text-4xl font-black text-slate-900 block">
                        {adminReviewsData.centre?.averageRating?.toFixed(1) || '0.0'}
                      </span>
                      <div className="flex items-center justify-center text-amber-400 my-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= Math.round(adminReviewsData.centre?.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-600 font-bold block">
                        {adminReviewsData.centre?.totalReviews || 0} {lang === 'hi' ? 'कुल किसान समीक्षाएं' : 'Total Farmer Ratings'}
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div className="flex-1 space-y-1 text-[11px]">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = adminReviewsData.distribution ? (adminReviewsData.distribution[stars] || 0) : 0;
                        const total = adminReviewsData.centre?.totalReviews || 1;
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="w-4 font-bold text-slate-600">{stars}★</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="w-5 text-right text-slate-500 font-data">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Records */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      {lang === 'hi' ? 'पंजीकृत किसानों की समीक्षाएं एवं फीडबैक' : 'Registered Farmer Reviews & Comments'}
                    </h4>

                    {adminReviewsData.reviews && adminReviewsData.reviews.length > 0 ? (
                      <div className="space-y-3">
                        {adminReviewsData.reviews.map((rev) => (
                          <div key={rev._id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{rev.farmerName}</span>
                                {rev.farmerVillage && (
                                  <span className="text-[10px] text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                                    {rev.farmerVillage}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                  />
                                ))}
                                <span className="text-xs font-bold text-slate-700 ml-1.5">{rev.rating}/5</span>
                              </div>
                            </div>

                            {rev.comment ? (
                              <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                                "{rev.comment}"
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">
                                {lang === 'hi' ? '(कोई लिखित टिप्पणी दर्ज नहीं)' : '(No written comments)'}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                              {rev.cropType && <span>{lang === 'hi' ? 'तौल फसल:' : 'Crop:'} <strong>{rev.cropType}</strong></span>}
                              <span>{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        {lang === 'hi' ? 'इस केंद्र पर अभी तक कोई किसान समीक्षा प्राप्त नहीं हुई है।' : 'No farmer feedback submitted for this centre yet.'}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {lang === 'hi' ? 'समीक्षा विवरण लोड करने में असमर्थ' : 'Unable to load reviews'}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3 px-6 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setAdminReviewsCentre(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-medium hover:bg-emerald-900 transition-colors"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
