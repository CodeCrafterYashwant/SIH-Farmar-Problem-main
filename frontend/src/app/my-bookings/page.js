'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../utils/api';
import { translations, getStoredLang } from '../../utils/translations';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Building2, 
  Printer, 
  Scale, 
  IndianRupee, 
  ShieldCheck,
  Check,
  Star,
  MessageSquare,
  Send,
  ThumbsUp,
  Edit2
} from 'lucide-react';

export default function MyBookingsPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Review & Rating State
  const [reviewsMap, setReviewsMap] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewSubmittingId, setReviewSubmittingId] = useState(null);
  const [hoverRating, setHoverRating] = useState({});

  const fetchMyReviews = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sih_token') : null;
    if (!token) return;
    try {
      const res = await apiRequest('/api/reviews/my');
      if (res.reviews) {
        const map = {};
        res.reviews.forEach((r) => {
          map[r.bookingId] = r;
        });
        setReviewsMap(map);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const fetchMyBookings = async (isSilent = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sih_token') : null;
    if (!token) {
      router.replace('/');
      return;
    }
    try {
      if (!isSilent) setLoading(true);
      const res = await apiRequest('/api/bookings/my');
      if (res.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      if (err.status === 401 || err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('token') || err.message?.includes('Token')) {
        router.replace('/');
      } else if (!isSilent) {
        setError(err.message || (lang === 'hi' ? 'बुकिंग लोड करने में त्रुटि' : 'Failed to load bookings'));
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sih_token') : null;
    if (!token) {
      router.replace('/');
      return;
    }

    setLang(getStoredLang());
    const handleLangChange = () => setLang(getStoredLang());
    window.addEventListener('languageChange', handleLangChange);

    fetchMyBookings(false);
    fetchMyReviews();

    // Auto-refresh every 5 seconds for real-time live updates
    const interval = setInterval(() => {
      fetchMyBookings(true);
    }, 5000);

    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      clearInterval(interval);
    };
  }, []);

  const handleReviewSubmit = async (bookingId) => {
    const draft = reviewDrafts[bookingId] || {};
    const existing = reviewsMap[bookingId];
    const rating = draft.rating || (existing ? existing.rating : 5);
    const comment = draft.comment !== undefined ? draft.comment : (existing ? existing.comment : '');

    setReviewSubmittingId(bookingId);
    setError(null);
    setMessage(null);

    try {
      const res = await apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ bookingId, rating, comment }),
      });
      if (res.success && res.review) {
        setReviewsMap((prev) => ({ ...prev, [bookingId]: res.review }));
        setReviewDrafts((prev) => ({
          ...prev,
          [bookingId]: { ...prev[bookingId], isEditing: false },
        }));
        setMessage(lang === 'hi' ? 'मंडी केंद्र की आपकी समीक्षा सफलतापूर्वक दर्ज हो गई!' : 'Thank you! Mandi review submitted successfully.');
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'समीक्षा दर्ज करने में त्रुटि' : 'Failed to submit review'));
    } finally {
      setReviewSubmittingId(null);
    }
  };

  const t = translations[lang] || translations.hi;

  const handleCancelBooking = async (id) => {
    const confirmPrompt = lang === 'hi'
      ? 'क्या आप वाकई इस स्लॉट बुकिंग को रद्द करना चाहते हैं? इससे यह स्थान अन्य किसान भाई हेतु उपलब्ध हो जाएगा।'
      : 'Are you sure you want to cancel this booking? This will restore capacity for other farmers.';

    if (!confirm(confirmPrompt)) {
      return;
    }

    setCancellingId(id);
    setError(null);
    setMessage(null);

    try {
      await apiRequest(`/api/bookings/${id}`, {
        method: 'DELETE',
      });
      setMessage(lang === 'hi' ? 'बुकिंग सफलतापूर्वक रद्द कर दी गई एवं स्लॉट क्षमता बहाल हो गई।' : 'Booking cancelled successfully.');
      fetchMyBookings(false);
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'बुकिंग रद्द करने में विफलता' : 'Failed to cancel booking'));
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Booked':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            {lang === 'hi' ? 'स्लॉट बुक (Booked)' : 'Slot Booked'}
          </span>
        );
      case 'CheckedIn':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            {lang === 'hi' ? 'गेट आगमन दर्ज (Checked In)' : 'Gate Checked In'}
          </span>
        );
      case 'Serving':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 animate-pulse">
            {lang === 'hi' ? 'कांटे पर तौल जारी (Now Serving)' : 'Now Serving at Scale'}
          </span>
        );
      case 'Procured':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'hi' ? 'तौल पूर्ण व उपार्जित (Procured)' : 'Procured & Verified'}</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            {lang === 'hi' ? 'रद्द (Cancelled)' : 'Cancelled'}
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] py-8 px-4 sm:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b-2 border-slate-200 p-5 rounded-2xl mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-orange-700 uppercase tracking-wide">
                {lang === 'hi' ? 'किसान सेवा पोर्टल | डिजिटल टोकन पर्ची' : 'Farmer Service Portal | Digital Token Slip'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>{lang === 'hi' ? 'लाइव सिंक' : 'Live Sync'}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-blue-950 mt-1">
              {lang === 'hi' ? 'मेरी मंडी बुकिंग व टोकन पर्ची' : 'My Procurement Tokens & Bookings'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {lang === 'hi' 
                ? 'अपनी टोकन संख्या देखें, प्रमाणित वजन व भुगतान राशि सत्यापित करें, अथवा लाइव तौल पंक्ति ट्रैक करें' 
                : 'View appointment tokens, verify certified scale weight & payout amount, or track queue'}
            </p>
          </div>

          <Link
            href="/centres"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl shadow-sm transition-colors self-start sm:self-auto active:scale-95"
          >
            <span>{lang === 'hi' ? '+ नया स्लॉट बुक करें' : '+ Book New Slot'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-bold shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 font-bold shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="w-8 h-8 border-3 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs font-bold">
              {lang === 'hi' ? 'आपकी बुकिंग जानकारी लोड हो रही है...' : 'Loading your booking tokens...'}
            </span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <Ticket className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-900 mb-1">
              {lang === 'hi' ? 'कोई सक्रिय बुकिंग उपलब्ध नहीं है' : 'No active bookings found'}
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              {lang === 'hi' 
                ? 'आपने अभी तक किसी उपार्जन केंद्र पर फसल तौल हेतु स्लॉट बुक नहीं किया है।' 
                : "You haven't booked any procurement appointment yet."}
            </p>
            <Link
              href="/centres"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow transition-colors"
            >
              <span>{lang === 'hi' ? 'उपार्जन केंद्र चुनें व स्लॉट बुक करें' : 'Choose Mandi & Book Slot'}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b._id}
                className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-blue-950 transition-all"
              >
                {/* Top Token Bar */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-950 text-white flex items-center justify-center font-bold">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                        {lang === 'hi' ? 'टोकन संख्या (Token ID)' : 'Token Number'}
                      </span>
                      <span className="text-sm font-mono font-black text-blue-950">
                        {b.tokenNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(b.status)}
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Print Token Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'प्रिंट' : 'Print'}</span>
                    </button>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-0.5">
                      {lang === 'hi' ? 'उपार्जन केंद्र (Mandi):' : 'Procurement Mandi:'}
                    </span>
                    <strong className="text-slate-900 block text-sm font-black">
                      {b.centreId?.name}
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      {b.centreId?.district}, {b.centreId?.state} ({b.centreId?.code})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px] mb-0.5">
                      {lang === 'hi' ? 'तौल दिनांक व समय (Slot Window):' : 'Appointment Date & Window:'}
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Calendar className="w-3.5 h-3.5 text-blue-900" />
                      <span>{new Date(b.slotId?.date || b.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 font-mono mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-orange-600" />
                      <span>{b.slotId?.startTime} - {b.slotId?.endTime}</span>
                    </div>
                  </div>

                  <div>
                    {b.procurement ? (
                      <>
                        <span className="text-slate-500 block text-[11px] mb-0.5">
                          {lang === 'hi' ? 'तौल मात्रा व कुल राशि:' : 'Weighed Quantity & Amount:'}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <strong className="text-emerald-900 font-black text-base">
                            {b.procurement.quantityKg} kg
                          </strong>
                          <span className="text-slate-600 font-bold text-xs">
                            ({b.procurement.cropType})
                          </span>
                        </div>
                        <div className="text-emerald-700 font-black text-sm mt-0.5">
                          ₹{Number(b.procurement.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500 block text-[11px] mb-0.5">
                          {lang === 'hi' ? 'उपार्जन स्थिति व फसल:' : 'Procurement Status & Crop:'}
                        </span>
                        <strong className="text-slate-900 block font-bold text-sm">
                          {b.centreId?.cropTypesHandled?.join(', ') || (lang === 'hi' ? 'पंजीकृत फसल' : 'Registered Crop')}
                        </strong>
                        {b.status === 'Serving' ? (
                          <span className="text-purple-700 font-bold text-[11px] block mt-0.5 animate-pulse">
                            {lang === 'hi' ? '● इलेक्ट्रॉनिक कांटे पर तौल जारी...' : '● Weighing currently in progress...'}
                          </span>
                        ) : b.status === 'CheckedIn' ? (
                          <span className="text-blue-900 font-bold text-[11px] block mt-0.5">
                            {lang === 'hi' ? `कांटा कतार क्रम: #${b.queuePosition || 1}` : `Weighbridge Queue: #${b.queuePosition || 1}`}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium text-[11px] block mt-0.5">
                            {lang === 'hi' ? 'मंडी गेट पर आगमन दर्ज कराएं' : 'Check-in required at gate pass'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Verified Procurement & Payment Certificate (Real-Time Display) */}
                {b.procurement && (
                  <div className="mx-5 mb-5 p-4 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50/70 border-2 border-emerald-300 rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                          ✓
                        </div>
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                          {lang === 'hi' ? 'प्रमाणित इलेक्ट्रॉनिक तौल एवं देयक रसीद' : 'Certified Electronic Weighment & Payout Receipt'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        VOUCHER: {b.procurement._id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white/95 p-3 rounded-lg border border-emerald-200 shadow-xs">
                        <span className="text-[11px] text-slate-500 block font-medium">
                          {lang === 'hi' ? 'प्रमाणित शुद्ध वजन (Net Weight)' : 'Certified Net Weight'}
                        </span>
                        <span className="text-lg font-black text-slate-900 font-data block mt-0.5">
                          {b.procurement.quantityKg} <span className="text-xs font-bold text-slate-600">kg</span>
                        </span>
                        <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
                          ≈ {(b.procurement.quantityKg / 100).toFixed(2)} {lang === 'hi' ? 'क्विंटल' : 'Quintal'}
                        </span>
                      </div>

                      <div className="bg-white/95 p-3 rounded-lg border border-emerald-200 shadow-xs">
                        <span className="text-[11px] text-slate-500 block font-medium">
                          {lang === 'hi' ? 'गुणवत्ता श्रेणी व नमी' : 'Grade & Moisture'}
                        </span>
                        <span className="text-lg font-black text-slate-900 block mt-0.5">
                          Grade {b.procurement.qualityGrade}
                        </span>
                        <span className="text-[10px] text-slate-600 font-medium block mt-0.5">
                          {lang === 'hi' ? `नमी (Moisture): ${b.procurement.moisturePercent}%` : `Moisture: ${b.procurement.moisturePercent}%`}
                        </span>
                      </div>

                      <div className="bg-white/95 p-3 rounded-lg border border-emerald-200 shadow-xs">
                        <span className="text-[11px] text-slate-500 block font-medium">
                          {lang === 'hi' ? 'समर्थन मूल्य दर (MSP Rate)' : 'Govt MSP Rate'}
                        </span>
                        <span className="text-lg font-black text-slate-900 font-data block mt-0.5">
                          ₹{b.procurement.ratePerKg} <span className="text-xs font-bold text-slate-600">/ kg</span>
                        </span>
                        <span className="text-[10px] text-slate-600 font-medium block mt-0.5">
                          ₹{(b.procurement.ratePerKg * 100).toFixed(0)} / Qtl
                        </span>
                      </div>

                      <div className="bg-emerald-850 bg-emerald-900 text-white p-3 rounded-lg shadow-xs">
                        <span className="text-[11px] text-emerald-200 block font-medium">
                          {lang === 'hi' ? 'कुल देय राशि (Total Payable)' : 'Total Amount Payable'}
                        </span>
                        <span className="text-lg font-black text-emerald-50 font-data block mt-0.5">
                          ₹{Number(b.procurement.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">
                          {lang === 'hi' ? 'आधार लिंक बैंक खाता' : 'Direct Bank Transfer'}
                        </span>
                      </div>
                    </div>

                    {/* DBT Treasury Settlement Status Banner */}
                    <div className="mt-3 pt-2.5 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-950">
                          {lang === 'hi' ? 'डीबीटी ट्रेजरी भुगतान स्थिति:' : 'DBT Treasury Settlement:'}
                        </span>
                        {b.procurement.payment?.status === 'Paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-700 text-white shadow-xs">
                            <Check className="w-3 h-3" />
                            <span>{lang === 'hi' ? 'खाते में सफलतापूर्वक अंतरित (PFMS / RTGS Paid)' : 'Disbursed via PFMS / RTGS'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-950 border border-amber-300">
                            ⏳ {lang === 'hi' ? 'ट्रेजरी भुगतान प्रक्रियाधीन (In Process)' : 'Treasury Clearance In Progress'}
                          </span>
                        )}
                      </div>

                      {b.procurement.payment?.bankReferenceNumber && (
                        <div className="text-[11px] font-mono text-emerald-950 bg-white/95 px-2.5 py-1 rounded border border-emerald-300 font-bold">
                          <span>Bank UTR: </span>
                          <span className="text-blue-900 select-all">{b.procurement.payment.bankReferenceNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Farmer Mandi Rating & Review Card (Post-Weighment) */}
                {b.status === 'Procured' && (() => {
                  const existingReview = reviewsMap[b._id];
                  const draft = reviewDrafts[b._id] || {};
                  const isEditing = draft.isEditing || !existingReview;
                  const currentRating = draft.rating || (existingReview ? existingReview.rating : 5);
                  const currentComment = draft.comment !== undefined ? draft.comment : (existingReview ? existingReview.comment : '');
                  const isSubmitting = reviewSubmittingId === b._id;

                  const ratingLabels = {
                    5: lang === 'hi' ? 'उत्कृष्ट (5/5) — तौल एवं सेवा अत्यधिक संतोषप्रद' : 'Excellent (5/5) — Highly Satisfied',
                    4: lang === 'hi' ? 'अच्छा (4/5) — पारदर्शी प्रक्रिया' : 'Very Good (4/5) — Smooth & Transparent',
                    3: lang === 'hi' ? 'संतोषजनक (3/5) — सामान्य व्यवस्था' : 'Average (3/5) — Standard Facility',
                    2: lang === 'hi' ? 'सुधार अपेक्षित (2/5) — देरी या असुविधा' : 'Needs Improvement (2/5) — Delays faced',
                    1: lang === 'hi' ? 'असंतोषजनक (1/5) — समस्या का सामना करना पड़ा' : 'Poor (1/5) — Significant Issues',
                  };

                  return (
                    <div className="mx-5 mb-5 p-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-yellow-50/60 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-amber-200/80">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                            ★
                          </div>
                          <div>
                            <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                              {lang === 'hi' ? 'मंडी केंद्र अनुभव एवं तौल रेटिंग' : 'Mandi Centre & Weighing Experience Rating'}
                            </span>
                            <span className="text-[10px] text-amber-900/80 block font-normal">
                              {lang === 'hi' ? 'आपकी रेटिंग से जिला प्रशासन गुणवत्ता मॉनिटर करेगा और साथी किसानों को सही केंद्र चुनने में मदद मिलेगी' : 'Monitored by District Admin to ensure service quality and help farmers choose best mandis.'}
                            </span>
                          </div>
                        </div>

                        {existingReview && !isEditing && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-700" />
                            {lang === 'hi' ? 'समीक्षा दर्ज है' : 'Verified Review Submitted'}
                          </span>
                        )}
                      </div>

                      {existingReview && !isEditing ? (
                        <div className="bg-white/95 p-3.5 rounded-lg border border-amber-200 shadow-xs">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center text-amber-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= existingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-black text-slate-800">
                                {existingReview.rating} / 5
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium ml-1">
                                • {ratingLabels[existingReview.rating]}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setReviewDrafts((prev) => ({
                                  ...prev,
                                  [b._id]: {
                                    rating: existingReview.rating,
                                    comment: existingReview.comment,
                                    isEditing: true,
                                  },
                                }));
                              }}
                              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 underline underline-offset-2"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{lang === 'hi' ? 'समीक्षा बदलें' : 'Edit Review'}</span>
                            </button>
                          </div>

                          {existingReview.comment ? (
                            <p className="mt-2 text-xs text-slate-700 italic bg-amber-50/50 p-2.5 rounded border border-amber-100">
                              "{existingReview.comment}"
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] text-slate-400 italic">
                              {lang === 'hi' ? '(कोई टिप्पणी नहीं लिखी गई)' : '(No written comments provided)'}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white/95 p-4 rounded-lg border border-amber-200 shadow-xs space-y-3">
                          {/* Star Selector */}
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 block mb-1">
                              {lang === 'hi' ? 'तौल, नमी जांच एवं स्टाफ का व्यवहार (1 से 5 स्टार):' : 'Weighment accuracy, moisture inspection & staff rating:'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const activeStar = (hoverRating[b._id] || currentRating) >= star;
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => {
                                      setReviewDrafts((prev) => ({
                                        ...prev,
                                        [b._id]: { ...prev[b._id], rating: star },
                                      }));
                                    }}
                                    onMouseEnter={() => setHoverRating((prev) => ({ ...prev, [b._id]: star }))}
                                    onMouseLeave={() => setHoverRating((prev) => ({ ...prev, [b._id]: null }))}
                                    className="p-1 hover:scale-125 transition-transform"
                                  >
                                    <Star
                                      className={`w-6 h-6 ${activeStar ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                    />
                                  </button>
                                );
                              })}
                              <span className="ml-2 text-xs font-bold text-amber-900 font-data">
                                {ratingLabels[hoverRating[b._id] || currentRating]}
                              </span>
                            </div>
                          </div>

                          {/* Comment box */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              {lang === 'hi' ? 'अपनी राय या सुझाव लिखें (वैकल्पिक):' : 'Write your comments or feedback (Optional):'}
                            </label>
                            <textarea
                              rows="2"
                              value={currentComment}
                              onChange={(e) => {
                                const val = e.target.value;
                                setReviewDrafts((prev) => ({
                                  ...prev,
                                  [b._id]: { ...prev[b._id], comment: val },
                                }));
                              }}
                              placeholder={lang === 'hi' ? 'उदाहरण: कांटा तौल बहुत सही थी, पर्ची तुरंत मिली एवं स्टाफ का व्यवहार उत्तम था...' : 'e.g. Weighbridge scale was accurate, quick token clearance, courteous staff...'}
                              className="w-full p-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {existingReview && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewDrafts((prev) => ({
                                    ...prev,
                                    [b._id]: { ...prev[b._id], isEditing: false },
                                  }));
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                              >
                                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleReviewSubmit(b._id)}
                              disabled={isSubmitting}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>
                                {isSubmitting
                                  ? (lang === 'hi' ? 'सबमिट हो रहा है...' : 'Submitting...')
                                  : (lang === 'hi' ? 'रेटिंग व समीक्षा सबमिट करें' : 'Submit Rating & Feedback')}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Footer Controls */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 px-5 flex items-center justify-between">
                  <Link
                    href={`/queue/${b.centreId?._id}`}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-950 hover:underline"
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-900" />
                    <span>{lang === 'hi' ? 'लाइव कांटा पंक्ति देखें' : 'View Live Scale Queue'}</span>
                  </Link>

                  {b.status === 'Booked' && (
                    <button
                      onClick={() => handleCancelBooking(b._id)}
                      disabled={cancellingId === b._id}
                      className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{cancellingId === b._id ? '...' : (lang === 'hi' ? 'बुकिंग रद्द करें' : 'Cancel Booking')}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
