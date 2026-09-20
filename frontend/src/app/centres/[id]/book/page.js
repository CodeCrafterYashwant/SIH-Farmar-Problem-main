'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../../utils/api';
import { translations, getStoredLang } from '../../../../utils/translations';
import { Calendar, Clock, CheckCircle2, AlertCircle, ArrowLeft, Printer, ShieldCheck, Ticket } from 'lucide-react';

export default function BookSlotPage() {
  const params = useParams();
  const router = useRouter();
  const centreId = params.id;

  const [lang, setLang] = useState('hi');
  const [centre, setCentre] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sih_token') : null;
    if (!token) {
      router.replace('/');
      return;
    }

    setLang(getStoredLang());
    const handleLangChange = () => setLang(getStoredLang());
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, [router]);

  const t = translations[lang] || translations.hi;

  // Fetch Centre Info with dynamic MSP support
  useEffect(() => {
    const fetchCentreInfo = async () => {
      try {
        // Try direct fetch first, fallback to list
        try {
          const direct = await apiRequest(`/api/centres/${centreId}`);
          if (direct.centre) {
            setCentre(direct.centre);
            return;
          }
        } catch (_) {}

        const res = await apiRequest('/api/centres');
        if (res.centres) {
          const matched = res.centres.find((c) => c._id === centreId);
          if (matched) setCentre(matched);
        }
      } catch (err) {
        console.error('Failed to load centre details:', err);
      }
    };
    if (centreId) fetchCentreInfo();

    const handleMspUpdate = (e) => {
      if (e.detail?.centre && e.detail.centre._id === centreId) {
        setCentre(e.detail.centre);
      } else {
        fetchCentreInfo();
      }
    };
    window.addEventListener('centreMspUpdated', handleMspUpdate);
    return () => window.removeEventListener('centreMspUpdated', handleMspUpdate);
  }, [centreId]);

  // Fetch Available Slots for Centre + Date
  useEffect(() => {
    const fetchSlots = async () => {
      if (!centreId) return;
      setLoadingSlots(true);
      setError(null);
      try {
        const res = await apiRequest(`/api/slots?centreId=${centreId}&date=${selectedDate}`);
        if (res.slots) {
          setSlots(res.slots);
          if (res.slots.length > 0) {
            setSelectedSlotId(res.slots[0]._id);
          } else {
            setSelectedSlotId(null);
          }
        }
      } catch (err) {
        setError(err.message || (lang === 'hi' ? 'स्लॉट लोड करने में त्रुटि' : 'Failed to load slots'));
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [centreId, selectedDate]);

  const handleBooking = async () => {
    if (!selectedSlotId) {
      setError(lang === 'hi' ? 'कृपया पहले एक समय स्लॉट चुनें' : 'Please select a time slot first');
      return;
    }

    const token = localStorage.getItem('sih_token');
    if (!token) {
      router.push(`/?redirect=/centres/${centreId}/book`);
      return;
    }

    setBookingLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ slotId: selectedSlotId }),
      });

      if (res.success && res.booking) {
        setBookingSuccess(res.booking);
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'स्लॉट बुकिंग असफल रही। कृपया पुनः प्रयास करें।' : 'Slot booking failed. Please try again.'));
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/centres"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? '← उपार्जन केंद्र सूची पर वापस जाएं' : '← Back to Mandi Directory'}</span>
        </Link>

        {/* Container */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 border-b-2 border-emerald-500">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block font-data">
              {centre ? `${centre.district}, ${centre.state} (${centre.code})` : (lang === 'hi' ? 'शासकीय उपार्जन केंद्र' : 'Government Mandi')}
            </span>
            <h1 className="text-xl sm:text-2xl font-serif mt-1">
              {centre?.name || (lang === 'hi' ? 'उपार्जन केंद्र समय स्लॉट बुकिंग' : 'Mandi Appointment Slot Booking')}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              {lang === 'hi' 
                ? 'अपनी सुविधानुसार दिनांक व 2 घंटे का समय चक्र चुनें एवं डिजिटल टोकन प्राप्त करें' 
                : 'Choose your preferred date and 2-hour window to generate your official mandi token'}
            </p>

            {centre?.ratePerKg && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  {lang === 'hi' ? '🏛️ इस केंद्र पर लाइव MSP दरें:' : '🏛️ Live Mandi MSP Rates:'}
                </span>
                {Object.entries(centre.ratePerKg).map(([c, r]) => (
                  <span key={c} className="inline-flex items-center gap-1 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold shadow-sm">
                    {c}: ₹{Number(r).toLocaleString('en-IN')}/kg
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="m-6 mb-0 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {bookingSuccess ? (
            /* Official Digital Token Appointment Slip */
            <div className="p-6 sm:p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider block">
                  {lang === 'hi' ? '✓ टोकन सफलतापूर्वक सृजित' : '✓ Appointment Confirmed'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-slate-900 mt-1 font-data">
                  {bookingSuccess.tokenNumber}
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  {lang === 'hi'
                    ? 'आपकी फसल तौल हेतु स्लॉट आरक्षित हो गया है। कृपया नियत समय पर मंडी गेट पर यह टोकन प्रस्तुत करें।'
                    : 'Your procurement slot has been confirmed. Please present this token at the mandi gate upon arrival.'}
                </p>
              </div>

              {/* Printable Slip Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left max-w-md mx-auto space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">{lang === 'hi' ? 'उपार्जन केंद्र:' : 'Procurement Mandi:'}</span>
                  <span className="font-semibold text-slate-900">{centre?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">{lang === 'hi' ? 'आरक्षित दिनांक:' : 'Scheduled Date:'}</span>
                  <span className="font-semibold text-slate-900 font-data">{new Date(selectedDate).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">{lang === 'hi' ? 'समय विंडो:' : 'Time Window:'}</span>
                  <span className="font-data font-semibold text-emerald-900">
                    {slots.find((s) => s._id === selectedSlotId)?.startTime} - {slots.find((s) => s._id === selectedSlotId)?.endTime}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">{lang === 'hi' ? 'टोकन स्थिति:' : 'Token Status:'}</span>
                  <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {bookingSuccess.status || 'Booked'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'टोकन पर्ची प्रिंट करें' : 'Print Token Slip'}</span>
                </button>
                <Link
                  href="/my-bookings"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  <span>{lang === 'hi' ? 'मेरी बुकिंग सूची देखें →' : 'Go to My Bookings →'}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Step 1: Select Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>1. {lang === 'hi' ? 'उपार्जन दिनांक का चयन करें' : 'Select Procurement Date'} *</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Step 2: Select 2-Hour Time Slot */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>2. {lang === 'hi' ? 'दैनिक समय स्लॉट चुनें' : 'Select Time Window'} *</span>
                </label>

                {loadingSlots ? (
                  <div className="py-8 text-center text-slate-500 text-xs font-medium">
                    {lang === 'hi' ? 'उपलब्ध स्लॉट लोड हो रहे हैं...' : 'Checking slot availability...'}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-center">
                    <p className="font-semibold">
                      {lang === 'hi' 
                        ? 'चयनित दिनांक हेतु कोई स्लॉट उपलब्ध नहीं है।' 
                        : 'No slots available for this date.'}
                    </p>
                    <p className="text-[11px] text-amber-800 mt-1">
                      {lang === 'hi'
                        ? 'कृपया कोई अन्य दिनांक चुनें अथवा मंडी प्रशासन द्वारा स्लॉट खोले जाने की प्रतीक्षा करें।'
                        : 'Please choose another date or contact the mandi administration.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {slots.map((s) => {
                      const booked = s.bookedCount !== undefined ? s.bookedCount : (s.currentBookings || 0);
                      const capacity = s.maxCapacity || 10;
                      const isFull = booked >= capacity;
                      const isSelected = selectedSlotId === s._id;
                      const remaining = Math.max(0, capacity - booked);

                      return (
                        <button
                          type="button"
                          key={s._id}
                          disabled={isFull}
                          onClick={() => setSelectedSlotId(s._id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-emerald-700 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-700/20'
                              : isFull
                              ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-data font-semibold text-sm text-slate-900">
                              {s.startTime} - {s.endTime}
                            </span>
                            {isFull ? (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-rose-100 text-rose-800 border border-rose-200">
                                {lang === 'hi' ? 'पूर्ण' : 'Full'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-200 font-data">
                                {lang === 'hi' ? `${remaining} उपलब्ध` : `${remaining} available`}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block font-data">
                            {lang === 'hi' 
                              ? `क्षमता: ${booked}/${capacity} किसान टोकन` 
                              : `Capacity: ${booked}/${capacity} tokens`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Reservation */}
              <button
                type="button"
                onClick={handleBooking}
                disabled={bookingLoading || !selectedSlotId || slots.length === 0}
                className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-all shadow-sm active:scale-95 disabled:opacity-40"
              >
                {bookingLoading 
                  ? (lang === 'hi' ? 'टोकन सृजित हो रहा है...' : 'Reserving slot...') 
                  : (lang === 'hi' ? '✓ टोकन स्लॉट आरक्षित करें (Confirm & Book)' : '✓ Confirm & Book Slot')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
