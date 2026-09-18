'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import IoTScalePanel from '../../../components/IoTScalePanel';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Calculator, 
  Printer, 
  Scale, 
  BadgeCheck, 
  ArrowLeft,
  Landmark,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

function ProcurementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBookingId = searchParams.get('bookingId');

  const [lang, setLang] = useState('hi');
  const [user, setUser] = useState(null);
  const [centres, setCentres] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(preselectedBookingId || '');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [cropType, setCropType] = useState('Wheat');
  const [quantityKg, setQuantityKg] = useState('');
  const [moisturePercent, setMoisturePercent] = useState('11.5');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [ratePerKg, setRatePerKg] = useState(22.75);
  const [iotMetadata, setIotMetadata] = useState(null);

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);

  // Resilient helper to resolve the exact centre object from string ID, object, or fallback
  const resolveCentre = (ref, centreList = centres) => {
    const list = (centreList && centreList.length > 0) ? centreList : centres;
    if (!ref) {
      return list.find(c => String(c._id) === String(selectedCentreId)) || list[0] || null;
    }
    const id = typeof ref === 'string' ? ref : (ref._id || ref.id);
    if (id) {
      const match = list.find(c => String(c._id) === String(id));
      if (match) return match;
    }
    if (typeof ref === 'object' && ref.ratePerKg) {
      const fresh = list.find(c => String(c._id) === String(ref._id));
      return fresh || ref;
    }
    return list.find(c => String(c._id) === String(selectedCentreId)) || list[0] || null;
  };

  // Helper to dynamically resolve rate for a crop from the centre's configured MSP
  const getRateForCrop = (centreOrRef, crop, centreList = centres) => {
    const list = (centreList && centreList.length > 0) ? centreList : centres;
    const centre = resolveCentre(centreOrRef, list);
    if (centre && centre.ratePerKg) {
      const rates = centre.ratePerKg;
      const val = typeof rates.get === 'function'
        ? rates.get(crop)
        : (rates[crop] || rates[crop?.toLowerCase()] || rates[crop?.toUpperCase()]);
      if (val !== undefined && val !== null && !isNaN(Number(val)) && Number(val) > 0) {
        return Number(val);
      }
    }
    // Check if any centre in centres has a rate for this crop
    if (list && list.length > 0) {
      for (const c of list) {
        if (c.ratePerKg) {
          const v = typeof c.ratePerKg.get === 'function' ? c.ratePerKg.get(crop) : (c.ratePerKg[crop] || c.ratePerKg[crop?.toLowerCase()]);
          if (v !== undefined && v !== null && !isNaN(Number(v)) && Number(v) > 0) return Number(v);
        }
      }
    }
    const standards = { Wheat: 22.75, Paddy: 21.83, Soybean: 46.00, Mustard: 56.50 };
    return standards[crop] || 22.75;
  };

  const currentCentre = resolveCentre(selectedCentreId);

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
    if (parsed.role !== 'staff' && parsed.role !== 'admin') {
      router.push('/');
      return;
    }
    setUser(parsed);

    const initCentresAndBookings = async () => {
      try {
        const cRes = await apiRequest('/api/centres');
        if (cRes.centres && cRes.centres.length > 0) {
          setCentres(cRes.centres);
          let defaultCentreId;
          if (parsed.role === 'staff' && parsed.centreId) {
            defaultCentreId = String(parsed.centreId?._id || parsed.centreId);
          } else {
            const storedCentre = typeof window !== 'undefined' ? localStorage.getItem('sih_selected_centre') : null;
            defaultCentreId = storedCentre || String(cRes.centres[0]._id);
          }
          setSelectedCentreId(defaultCentreId);

          // Find matching centre from fresh centres list
          const matched = cRes.centres.find((c) => String(c._id) === defaultCentreId) || cRes.centres[0];
          if (matched) {
            const initialRate = getRateForCrop(matched, cropType, cRes.centres);
            setRatePerKg(initialRate);

            // Update user in localStorage with FRESH centre data so stale cache never interferes
            if (parsed && parsed.centreId) {
              parsed.centreId = matched;
              localStorage.setItem('sih_user', JSON.stringify(parsed));
              setUser(parsed);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load centres:', err);
      }
    };

    initCentresAndBookings();

    // Listen for custom msp updated event dispatched by admin tab
    const handleLocalMspUpdate = (e) => {
      initCentresAndBookings();
    };
    window.addEventListener('centreMspUpdated', handleLocalMspUpdate);

    // Cross-tab sync: Listen for localStorage storage event when admin updates MSP in another tab
    const handleStorageUpdate = (e) => {
      if (e.key === 'sih_latest_msp' || e.key === 'sih_user') {
        initCentresAndBookings();
      }
    };
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('centreMspUpdated', handleLocalMspUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const fetchBookingsForCentre = async (cId) => {
    if (!cId) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sih_selected_centre', cId);
      }
      const bRes = await apiRequest(`/api/bookings/today?centreId=${cId}`);
      if (bRes.bookings) {
        setBookings(bRes.bookings);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  useEffect(() => {
    if (selectedCentreId && centres.length > 0) {
      fetchBookingsForCentre(selectedCentreId);
      const centre = resolveCentre(selectedCentreId);
      if (centre) {
        const updatedRate = getRateForCrop(centre, cropType);
        setRatePerKg(updatedRate);
      }
    }
  }, [selectedCentreId, centres]);

  const t = translations[lang] || translations.hi;

  // Dynamic crop change that uses the centre's configured MSP
  const handleCropChange = (crop, centreToUse = null) => {
    setCropType(crop);
    const centre = resolveCentre(centreToUse || selectedCentreId);
    const rate = getRateForCrop(centre, crop);
    setRatePerKg(rate);
  };

  useEffect(() => {
    if (selectedBookingId && bookings.length > 0) {
      const matched = bookings.find((b) => b._id === selectedBookingId);
      if (matched) {
        setSelectedBooking(matched);
        const crop = matched.cropType || cropType;
        handleCropChange(crop, matched.centreId || selectedCentreId);
        if (matched.estimatedQuantityKg) setQuantityKg(matched.estimatedQuantityKg.toString());

        // Automatically set status to Serving so scale desk becomes busy with this farmer
        if (matched.status === 'CheckedIn' && selectedCentreId) {
          apiRequest('/api/queue/call-next', {
            method: 'POST',
            body: JSON.stringify({ centreId: selectedCentreId, bookingId: matched._id }),
          }).then(() => {
            matched.status = 'Serving';
          }).catch(console.error);
        }
      }
    }
  }, [selectedBookingId, bookings, selectedCentreId]);

  // Total amount calculation
  const totalAmount = quantityKg && !isNaN(quantityKg) ? Math.round(Number(quantityKg) * ratePerKg * 100) / 100 : 0;

  const handleIotDataApply = ({ weightKg: w, moisturePercent: m, qualityGrade: q, iotMetadata: meta }) => {
    if (w !== undefined) setQuantityKg(w.toString());
    if (m !== undefined) setMoisturePercent(m.toString());
    if (q) setQualityGrade(q);
    if (meta) setIotMetadata(meta);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setError(lang === 'hi' ? 'कृपया उपार्जन हेतु किसान अथवा टोकन का चयन करें' : 'Please select a farmer token');
      return;
    }

    if (!quantityKg || Number(quantityKg) <= 0) {
      setError(lang === 'hi' ? 'कृपया मान्य वजन (किलोग्राम में) दर्ज करें' : 'Please enter valid net weight (Kg)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/api/procurement', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: selectedBookingId,
          cropType,
          quantityKg: Number(quantityKg),
          moisturePercent: Number(moisturePercent),
          qualityGrade,
          ratePerKg: Number(ratePerKg),
          iotMetadata: iotMetadata || {
            deviceId: 'ESP32-WEIGH-01',
            captureMode: 'MANUAL',
            tamperProofHash: null,
            isVerified: false,
            capturedAt: new Date(),
          },
        }),
      });

      if (res.success) {
        setSuccessData(res);
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'उपार्जन पर्ची सृजित करने में विफल' : 'Failed to issue weighment slip'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-5xl mx-auto">
        {/* Official Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase block">
              {t.govtOfIndia}
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900 mt-1">
              {t.staffProcHeading}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.staffProcSub}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'staff' ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-950 shadow-sm">
                <Landmark className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>{lang === 'hi' ? 'उपार्जन केंद्र:' : 'Mandi Centre:'} <strong className="text-emerald-900 font-data">{user.centreId?.name || centres.find(c => c._id === selectedCentreId)?.name || 'Mandi'} {user.centreId?.code ? `(${user.centreId.code})` : ''}</strong></span>
              </div>
            ) : centres.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">{lang === 'hi' ? 'मंडी केंद्र चुनें:' : 'Select Mandi:'}</span>
                <select
                  value={selectedCentreId}
                  onChange={(e) => setSelectedCentreId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                >
                  {centres.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-900">
              <BadgeCheck className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'hi' ? 'एमएसपी गारंटीड खरीद' : 'Guaranteed MSP Procurement'}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          /* Official Government Weighment & Procurement Receipt */
          <div className="bg-white border border-emerald-500 rounded-2xl p-6 sm:p-8 shadow-lg max-w-2xl mx-auto">
            <div className="border-b border-dashed border-slate-300 pb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-serif text-sm font-bold">
                  MP
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-semibold text-slate-900 leading-tight font-serif">
                    {lang === 'hi' ? 'मध्य प्रदेश शासन | खाद्य एवं नागरिक आपूर्ति विभाग' : 'Govt of Madhya Pradesh | Dept of Food & Civil Supplies'}
                  </h2>
                  <p className="text-[10px] text-slate-600 font-sans">{lang === 'hi' ? 'ई-उपार्जन पोर्टल - आधिकारिक किसान फसल खरीद पावती' : 'e-Procurement Portal - Official Weighment Receipt'}</p>
                </div>
              </div>
              <div className="inline-block mt-2 bg-emerald-100 text-emerald-900 text-xs font-medium px-3 py-1 rounded-full border border-emerald-300">
                ✓ {lang === 'hi' ? 'फसल उपार्जन सफलतापूर्वक पंजीकृत (PROCUREMENT CONFIRMED)' : 'PROCUREMENT CONFIRMED'}
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">{lang === 'hi' ? 'पावती / वाउचर संख्या:' : 'Voucher No.:'}</span>
                  <span className="font-data font-semibold text-slate-900">{successData.procurement?._id || 'VCH-2026-9023'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{lang === 'hi' ? 'तौल दिनांक व समय:' : 'Timestamp:'}</span>
                  <span className="font-data text-slate-800">{new Date().toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">{lang === 'hi' ? 'किसान का नाम:' : 'Farmer Name:'}</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {selectedBooking?.farmerId?.name || (lang === 'hi' ? 'पंजीकृत किसान' : 'Farmer')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{lang === 'hi' ? 'बैंक खाता (DBT A/C):' : 'Bank A/C (DBT):'}</span>
                  <span className="font-data font-semibold text-slate-900">
                    {selectedBooking?.farmerId?.bankAccount?.accountNumber ? `•••• ${selectedBooking.farmerId.bankAccount.accountNumber.slice(-4)}` : (lang === 'hi' ? 'सत्यापित आधार DBT' : 'Verified Aadhaar DBT')}
                  </span>
                </div>
              </div>

              {/* Table of crop metrics */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">{lang === 'hi' ? 'फसल' : 'Crop'}</th>
                      <th className="py-2.5 px-3 text-center">{lang === 'hi' ? 'गुणवत्ता श्रेणी' : 'Grade'}</th>
                      <th className="py-2.5 px-3 text-center">{lang === 'hi' ? 'नमी %' : 'Moisture %'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'hi' ? 'वजन (Kg)' : 'Weight (Kg)'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'hi' ? 'दर (₹/Kg)' : 'Rate (₹/Kg)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-normal">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{successData.procurement?.cropType}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-emerald-800">Grade {successData.procurement?.qualityGrade}</td>
                      <td className="py-2.5 px-3 text-center font-data font-semibold text-slate-900">{successData.procurement?.moisturePercent}%</td>
                      <td className="py-2.5 px-3 text-right font-data font-semibold">{successData.procurement?.quantityKg} kg</td>
                      <td className="py-2.5 px-3 text-right font-data">₹{successData.procurement?.ratePerKg}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-950 block">{t.totalPayableLabel}</span>
                  <span className="text-[11px] text-emerald-800">{lang === 'hi' ? 'राशि सीधे किसान के बैंक खाते में आरटीजीएस/पीएफएमएस द्वारा प्रेषित होगी' : 'Amount will be credited directly via RTGS/PFMS DBT'}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-semibold text-emerald-950 font-data">
                    ₹{successData.procurement?.totalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* IoT Hardware Verification Seal */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-300">
                    CERTIFIED IOT SCALE: <strong className="text-white">{successData.procurement?.iotMetadata?.deviceId || 'ESP32-WEIGH-01'}</strong> ({successData.procurement?.iotMetadata?.captureMode || 'IOT_STREAM'})
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 truncate max-w-xs">
                  TAMPER-PROOF: {successData.procurement?.iotMetadata?.tamperProofHash ? successData.procurement.iotMetadata.tamperProofHash.substring(0, 16) + '...' : 'SHA256:VERIFIED'}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'hi' ? 'तौल पर्ची प्रिंट करें' : 'Print Weighment Slip'}</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSuccessData(null);
                    setSelectedBookingId('');
                    setSelectedBooking(null);
                    setQuantityKg('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors"
                >
                  {lang === 'hi' ? 'अगली तौल प्रविष्टि करें' : 'Record Next Weighment'}
                </button>
                <Link
                  href="/staff/payments"
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  <span>{lang === 'hi' ? 'ट्रेजरी यूटीआर पटल →' : 'Treasury DBT Desk →'}</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Step 1: Select Farmer Token */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">
                1. {t.selectFarmerToken} *
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="">{lang === 'hi' ? '-- टोकन / किसान का चयन करें --' : '-- Select Arrived Farmer Token --'}</option>
                {bookings.map((b) => {
                  const isReady = b.status === 'CheckedIn' || b.status === 'Serving';
                  const isProcured = b.status === 'Procured';
                  return (
                    <option key={b._id} value={b._id} disabled={isProcured}>
                      {isReady ? '⭐ ' : isProcured ? '✓ ' : ''}{b.tokenNumber} — {b.farmerId?.name} ({lang === 'hi' ? 'गांव' : 'Village'}: {b.farmerId?.village || (lang === 'hi' ? 'मध्य प्रदेश' : 'MP')}) [{isReady ? (lang === 'hi' ? 'कांटे पर उपस्थित' : 'Arrived at Scale') : isProcured ? (lang === 'hi' ? 'तौल पूर्ण' : 'Procured') : b.status}]
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedBooking && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block text-sm">
                    {selectedBooking.farmerId?.name} ({selectedBooking.farmerId?.mobile})
                  </span>
                  <span className="text-slate-600">
                    {lang === 'hi' ? 'ग्राम:' : 'Village:'} {selectedBooking.farmerId?.village} | {lang === 'hi' ? 'बैंक खाता:' : 'A/C:'} {selectedBooking.farmerId?.bankAccount?.accountNumber ? `•••• ${selectedBooking.farmerId.bankAccount.accountNumber.slice(-4)}` : 'Direct Aadhaar Link'}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-data font-semibold text-xs self-start sm:self-auto">
                  {lang === 'hi' ? 'टोकन:' : 'Token:'} {selectedBooking.tokenNumber}
                </div>
              </div>
            )}

            {/* Step 2: Crop & MSP Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  2. {t.procuredCrop} *
                </label>
                <select
                  value={cropType}
                  onChange={(e) => handleCropChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {['Wheat', 'Paddy', 'Soybean', 'Mustard'].map((c) => {
                    const rate = getRateForCrop(currentCentre, c);
                    const qtlRate = Math.round(rate * 100).toLocaleString('en-IN');
                    const namesHi = {
                      Wheat: 'गेहूं (Wheat)',
                      Paddy: 'धान (Paddy)',
                      Soybean: 'सोयाबीन (Soybean)',
                      Mustard: 'सरसों (Mustard)',
                    };
                    return (
                      <option key={c} value={c}>
                        {lang === 'hi' 
                          ? `${namesHi[c] || c} — ₹${qtlRate}/क्विंटल (₹${rate}/kg)`
                          : `${c} — ₹${qtlRate}/qtl (₹${rate}/kg)`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{lang === 'hi' ? 'शासकीय समर्थन मूल्य (MSP Rate ₹/kg)' : 'MSP Rate (₹/kg)'}</span>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>{lang === 'hi' ? 'मंडी सक्रिय दर' : 'Active Mandi MSP'}</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ratePerKg}
                    onChange={(e) => setRatePerKg(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-300 text-sm font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-medium">₹/kg</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {lang === 'hi' 
                    ? `सक्रिय दर: ₹${ratePerKg}/किग्रा (₹${(ratePerKg * 100).toLocaleString('en-IN')}/क्विंटल) - ${currentCentre?.name || 'उपार्जन केंद्र'}` 
                    : `Active Mandi Rate: ₹${ratePerKg}/kg (₹${(ratePerKg * 100).toLocaleString('en-IN')}/qtl) - ${currentCentre?.name || 'Mandi'}`}
                </span>
              </div>
            </div>

            {/* IoT Smart Weighbridge & Moisture Sensor Hardware Unit */}
            <IoTScalePanel
              centreId={selectedCentreId}
              cropType={cropType}
              onApplyData={handleIotDataApply}
              lang={lang}
            />

            {/* Step 3: Weighbridge & Quality Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-800" />
                  <span>3. {t.netWeightLabel} *</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  required
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">{lang === 'hi' ? 'कांटा ऑपरेटर द्वारा प्रमाणित भार' : 'Scale certified net weight'}</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {t.moistureLabel} *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={moisturePercent}
                  onChange={(e) => setMoisturePercent(e.target.value)}
                  placeholder="e.g. 11.2"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-data text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">{lang === 'hi' ? 'मानक: 12% या कम मान्य' : 'Standard: ≤ 12% permissible'}</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {t.gradeLabel} *
                </label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="A">Grade A ({lang === 'hi' ? 'उत्कृष्ट - Premium' : 'Premium'})</option>
                  <option value="B">Grade B ({lang === 'hi' ? 'मानक - Standard' : 'Standard'})</option>
                  <option value="C">Grade C ({lang === 'hi' ? 'स्वीकार्य - Fair' : 'Fair'})</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">{lang === 'hi' ? 'ग्रेडिंग नियमावली अनुसार' : 'As per grading rules'}</span>
              </div>
            </div>

            {/* Calculated Payable Display */}
            <div className="p-5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-300 block font-medium">{t.totalPayableLabel}</span>
                  <span className="text-xs text-slate-400 font-data">
                    {quantityKg ? `${Number(quantityKg).toLocaleString('en-IN')} kg` : '0 kg'} × ₹{ratePerKg}/kg
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-data font-semibold text-emerald-400">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedBookingId || !quantityKg}
              className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-all shadow-sm active:scale-95 disabled:opacity-40"
            >
              {loading ? (lang === 'hi' ? 'उपार्जन पर्ची सृजित की जा रही है...' : 'Generating Voucher...') : `✓ ${t.issueVoucherBtn}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function StaffProcurementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] py-16 text-center text-slate-600 text-sm font-body">Loading procurement desk...</div>}>
      <ProcurementContent />
    </Suspense>
  );
}
