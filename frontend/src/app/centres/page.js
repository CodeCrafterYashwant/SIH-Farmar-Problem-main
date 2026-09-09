'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../utils/api';
import { translations, getStoredLang } from '../../utils/translations';
import { MapPin, Calendar, Wheat, Search, ArrowRight, Activity, ShieldCheck, Building2, Filter, Star, MessageSquare, X } from 'lucide-react';

export default function CentresPage() {
  const [lang, setLang] = useState('hi');
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedCrop, setSelectedCrop] = useState('ALL');

  // Reviews Modal State
  const [reviewsModalCentre, setReviewsModalCentre] = useState(null);
  const [centreReviewsLoading, setCentreReviewsLoading] = useState(false);
  const [centreReviewsData, setCentreReviewsData] = useState(null);

  useEffect(() => {
    setLang(getStoredLang());
    const handleLangChange = () => setLang(getStoredLang());
    window.addEventListener('languageChange', handleLangChange);

    const fetchCentres = async () => {
      try {
        const res = await apiRequest('/api/centres');
        if (res.centres) {
          setCentres(res.centres);
        }
      } catch (err) {
        console.error('Failed to fetch centres:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCentres();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  const handleOpenReviews = async (centre) => {
    setReviewsModalCentre(centre);
    setCentreReviewsLoading(true);
    setCentreReviewsData(null);
    try {
      const res = await apiRequest(`/api/reviews/centre/${centre._id}`);
      if (res.success) {
        setCentreReviewsData(res);
      }
    } catch (err) {
      console.error('Failed to load centre reviews:', err);
    } finally {
      setCentreReviewsLoading(false);
    }
  };

  // Extract unique districts
  const districts = Array.from(new Set(centres.map((c) => c.district).filter(Boolean)));

  const filteredCentres = centres.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(term) ||
      c.district.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term);
    
    const matchesDistrict = selectedDistrict === 'ALL' || c.district === selectedDistrict;
    const matchesCrop = selectedCrop === 'ALL' || (c.cropTypesHandled && c.cropTypesHandled.includes(selectedCrop));

    return matchesSearch && matchesDistrict && matchesCrop;
  });

  return (
    <div className="min-h-screen bg-[#f3f4f6] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="bg-white border-b-2 border-slate-200 p-5 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-orange-700 uppercase tracking-wide block">
              {lang === 'hi' ? 'राज्य कृषि विपणन बोर्ड | उपार्जन केंद्र संदर्शिका' : 'State Agriculture Marketing Board | Mandi Directory'}
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-blue-950 mt-0.5">
              {t.mandiPageTitle}
            </h1>
            <p className="font-body text-xs text-slate-600 font-normal mt-0.5">
              {t.mandiPageSubtitle}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={t.searchMandiPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-950 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">{t.district}:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs font-normal focus:outline-none focus:border-blue-950"
              >
                <option value="ALL">{t.allDistricts}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-600">{t.cropsHandled}:</span>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs font-normal focus:outline-none focus:border-blue-950"
              >
                <option value="ALL">{t.allCrops}</option>
                <option value="Wheat">{t.wheat}</option>
                <option value="Paddy">{t.paddy}</option>
                <option value="Soybean">{t.soybean}</option>
                <option value="Mustard">{t.mustard}</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-normal">
            <span>{t.activeCentresFound}: <strong className="text-blue-950 font-data font-semibold text-xs">{filteredCentres.length}</strong></span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="w-8 h-8 border-3 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs font-bold">
              {lang === 'hi' ? 'उपार्जन केंद्रों की जानकारी लोड हो रही है...' : 'Loading procurement centre records...'}
            </span>
          </div>
        ) : filteredCentres.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t.noCentresMatch}
            </h3>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDistrict('ALL');
                setSelectedCrop('ALL');
              }}
              className="mt-3 px-4 py-2 rounded-lg bg-blue-950 text-white text-xs font-bold"
            >
              {t.filterReset}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCentres.map((c) => (
              <div
                key={c._id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm interactive-card flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                    <span className="text-xs font-data font-semibold px-2.5 py-0.5 rounded bg-blue-100 text-blue-950 border border-blue-300">
                      {c.code}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      <span>{c.district}, {c.state}</span>
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-display text-base font-bold text-blue-950">
                        {c.name}
                      </h3>
                    </div>

                    {/* Star Rating & Reviews Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      {c.totalReviews > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReviews(c)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span className="font-data font-black">{c.averageRating ? c.averageRating.toFixed(1) : '5.0'}</span>
                          <span className="text-[10px] text-amber-800 font-normal">
                            ({c.totalReviews} {lang === 'hi' ? 'समीक्षाएं' : 'reviews'})
                          </span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-medium">
                          <Star className="w-3 h-3 text-slate-400" />
                          <span>{lang === 'hi' ? 'नया केंद्र (कोई रेटिंग नहीं)' : 'New Centre (No ratings yet)'}</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider mb-1.5 font-body">
                          {t.cropsHandled} & {t.mspRates}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {c.cropTypesHandled && c.cropTypesHandled.length > 0 ? (
                            c.cropTypesHandled.map((crop) => {
                              const rate = c.ratePerKg ? (c.ratePerKg[crop] || (c.ratePerKg.get && c.ratePerKg.get(crop))) : null;
                              return (
                                <span
                                  key={crop}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-medium"
                                >
                                  <Wheat className="w-3 h-3 text-emerald-700" />
                                  <span>{crop}</span>
                                  {rate && <strong className="text-emerald-950 font-data font-semibold">₹{rate}/kg</strong>}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-slate-600 font-normal">Wheat (₹22.75/kg), Paddy (₹21.83/kg)</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 text-[11px] text-slate-600 border-t border-slate-100 flex items-center gap-1 font-normal">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{lang === 'hi' ? 'शासकीय इलेक्ट्रॉनिक तौल कांटा एवं नमी मीटर प्रमाणित' : 'Government Electronic Weighbridge Certified'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/queue/${c._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-950 hover:text-blue-800"
                    >
                      <Activity className="w-3.5 h-3.5 text-blue-900" />
                      <span>{lang === 'hi' ? 'लाइव कांटा पंक्ति' : 'Live Queue'}</span>
                    </Link>

                    {c.totalReviews > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenReviews(c)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 ml-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{lang === 'hi' ? 'समीक्षाएं' : 'Reviews'}</span>
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/centres/${c._id}/book`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t.viewBookSlotsBtn}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Farmer Reviews & Ratings Modal */}
      {reviewsModalCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-50 p-4 px-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">
                  {lang === 'hi' ? 'किसान अनुभव एवं सेवा समीक्षा' : 'Farmer Weighment & Service Reviews'}
                </span>
                <h3 className="font-display text-base font-bold text-blue-950">
                  {reviewsModalCentre.name}
                </h3>
                <span className="text-xs text-slate-500">
                  {reviewsModalCentre.district}, {reviewsModalCentre.state}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReviewsModalCentre(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {centreReviewsLoading ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="w-7 h-7 border-2 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-xs font-bold">{lang === 'hi' ? 'समीक्षाएं लोड हो रही हैं...' : 'Loading reviews...'}</span>
                </div>
              ) : centreReviewsData ? (
                <>
                  {/* Rating Overview Summary */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-6">
                    <div className="text-center shrink-0">
                      <span className="font-data text-4xl font-black text-slate-900 block">
                        {centreReviewsData.centre?.averageRating?.toFixed(1) || '0.0'}
                      </span>
                      <div className="flex items-center justify-center text-amber-400 my-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= Math.round(centreReviewsData.centre?.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-600 font-bold block">
                        {centreReviewsData.centre?.totalReviews || 0} {lang === 'hi' ? 'कुल रेटिंग' : 'Total Ratings'}
                      </span>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="flex-1 space-y-1 text-[11px]">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = centreReviewsData.distribution ? (centreReviewsData.distribution[stars] || 0) : 0;
                        const total = centreReviewsData.centre?.totalReviews || 1;
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

                  {/* Reviews List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      {lang === 'hi' ? 'हाल की किसान टिप्पणियां' : 'Recent Farmer Comments'}
                    </h4>

                    {centreReviewsData.reviews && centreReviewsData.reviews.length > 0 ? (
                      <div className="space-y-3">
                        {centreReviewsData.reviews.map((rev) => (
                          <div key={rev._id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{rev.farmerName}</span>
                                {rev.farmerVillage && (
                                  <span className="text-[10px] text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
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
                              </div>
                            </div>

                            {rev.comment && (
                              <p className="text-xs text-slate-700 italic">
                                "{rev.comment}"
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              {rev.cropType && <span>{lang === 'hi' ? 'फसल:' : 'Crop:'} {rev.cropType}</span>}
                              <span>{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        {lang === 'hi' ? 'इस केंद्र हेतु अभी तक कोई समीक्षा दर्ज नहीं हुई है।' : 'No written reviews submitted for this centre yet.'}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {lang === 'hi' ? 'समीक्षा विवरण उपलब्ध नहीं है' : 'Unable to load reviews'}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3 px-6 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setReviewsModalCentre(null)}
                className="px-4 py-1.5 rounded-lg bg-blue-950 text-white text-xs font-bold hover:bg-blue-900 transition-colors"
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

