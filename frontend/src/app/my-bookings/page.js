'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../utils/api';
import { translations, getStoredLang } from '../../utils/translations';
import { Ticket, Calendar, Clock, MapPin, AlertCircle, Trash2, CheckCircle2, ArrowRight, Activity, Building2, Printer } from 'lucide-react';

export default function MyBookingsPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchMyBookings = async () => {
    try {
      const res = await apiRequest('/api/bookings/my');
      if (res.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        router.push('/');
      } else {
        setError(err.message || (lang === 'hi' ? 'बुकिंग लोड करने में त्रुटि' : 'Failed to load bookings'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLang(getStoredLang());
    const handleLangChange = () => setLang(getStoredLang());
    window.addEventListener('languageChange', handleLangChange);

    fetchMyBookings();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

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
      fetchMyBookings();
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
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            {lang === 'hi' ? 'तौल पूर्ण व उपार्जित (Procured)' : 'Procured & Verified'}
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
    <div className="min-h-screen bg-[#f3f4f6] py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b-2 border-slate-200 p-5 rounded-2xl mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black text-orange-700 uppercase tracking-wide block">
              {lang === 'hi' ? 'किसान सेवा पोर्टल | डिजिटल टोकन पर्ची' : 'Farmer Service Portal | Digital Token Slip'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-blue-950">
              {lang === 'hi' ? 'मेरी मंडी बुकिंग व टोकन पर्ची' : 'My Procurement Tokens & Bookings'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {lang === 'hi' 
                ? 'अपनी टोकन संख्या देखें, लाइव तौल पंक्ति ट्रैक करें अथवा समय स्लॉट निरस्त करें' 
                : 'View appointment tokens, track weighbridge queue position, or cancel slots'}
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
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 font-bold shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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
                    <span className="text-slate-500 block text-[11px] mb-0.5">
                      {lang === 'hi' ? 'फसल व अनुमानित मात्रा:' : 'Crop & Estimated Quantity:'}
                    </span>
                    <strong className="text-emerald-900 block font-bold text-sm">
                      {b.cropType} — {b.estimatedQuantityKg} kg
                    </strong>
                    {b.queuePosition && (
                      <span className="text-blue-900 font-bold text-[11px] block mt-0.5">
                        {lang === 'hi' ? `कांटा कतार क्रम: #${b.queuePosition}` : `Weighbridge Queue: #${b.queuePosition}`}
                      </span>
                    )}
                  </div>
                </div>

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
