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
  Search, 
  Clock 
} from 'lucide-react';

export default function StaffTodayPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [centres, setCentres] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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
    const parsedUser = JSON.parse(rawUser);
    if (parsedUser.role !== 'staff' && parsedUser.role !== 'admin') {
      router.push('/');
      return;
    }
    setUser(parsedUser);

    const initCentres = async () => {
      try {
        const res = await apiRequest('/api/centres');
        if (res.centres && res.centres.length > 0) {
          setCentres(res.centres);
          const storedCentre = typeof window !== 'undefined' ? localStorage.getItem('sih_selected_centre') : null;
          const defaultCentre = storedCentre || parsedUser.centreId?._id || parsedUser.centreId || res.centres[0]._id;
          setSelectedCentreId(defaultCentre);
        }
      } catch (err) {
        console.error('Failed to load centres:', err);
      }
    };

    initCentres();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  const fetchTodayBookings = async (cId) => {
    const targetCentre = cId || selectedCentreId;
    if (!targetCentre) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/api/bookings/today?centreId=${targetCentre}`);
      if (res.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'आज की बुकिंग सूची लोड करने में त्रुटि' : 'Failed to load today bookings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCentreId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sih_selected_centre', selectedCentreId);
      }
      fetchTodayBookings(selectedCentreId);
    }
  }, [selectedCentreId]);

  const handleCheckin = async (bookingId) => {
    setCheckingInId(bookingId);
    setMessage(null);
    setError(null);

    try {
      const res = await apiRequest('/api/queue/checkin', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });

      if (res.success) {
        setMessage(`${t.gateCheckinSuccess}${res.booking.queuePosition}`);
        fetchTodayBookings();
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'चेक-इन विफल' : 'Gate check-in failed'));
    } finally {
      setCheckingInId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      b.tokenNumber?.toLowerCase().includes(term) ||
      b.farmerId?.name?.toLowerCase().includes(term) ||
      b.farmerId?.mobile?.includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-6xl mx-auto">
        {/* Header with Centre Switcher and Quick Search */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase block">
              {t.govtOfIndia}
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900 mt-1">
              {t.staffTodayHeading}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.staffTodaySub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {centres.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">{lang === 'hi' ? 'मंडी केंद्र:' : 'Mandi:'}</span>
                <select
                  value={selectedCentreId}
                  onChange={(e) => setSelectedCentreId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {centres.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={t.searchTodayPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs font-medium">{lang === 'hi' ? 'आज के आगमन की सूची लोड हो रही है...' : 'Loading gate arrivals...'}</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-1">{lang === 'hi' ? 'आज के लिए कोई टोकन नहीं मिला' : 'No tokens found for today'}</h3>
            <p className="text-xs text-slate-500">{lang === 'hi' ? 'चयनित केंद्र के लिए आज की तिथि का कोई टोकन दर्ज नहीं है।' : 'No booked appointments for selected mandi today.'}</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between text-xs font-medium text-slate-700">
              <span>{lang === 'hi' ? `आज के कुल पंजीकृत टोकन: ${filteredBookings.length}` : `Total Registered Tokens Today: ${filteredBookings.length}`}</span>
              <span className="text-[11px] text-slate-500">{lang === 'hi' ? 'चेक-इन उपरांत किसान को तौल क्रम आवंटित होगा' : 'Queue sequence will be assigned upon check-in'}</span>
            </div>

            <div className="divide-y divide-slate-200">
              {filteredBookings.map((b) => {
                const isBooked = b.status === 'Booked';
                return (
                  <div
                    key={b._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="font-data font-semibold text-base text-slate-900">
                          {b.tokenNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${
                          b.status === 'Booked'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : b.status === 'Procured'
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                            : b.status === 'Serving'
                            ? 'bg-blue-100 text-blue-950 border border-blue-300'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        }`}>
                          {b.status} {b.queuePosition ? `(#${b.queuePosition})` : ''}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-900">
                        {b.farmerId?.name || (lang === 'hi' ? 'किसान' : 'Farmer')}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>{lang === 'hi' ? 'मो.:' : 'Mobile:'} <strong className="font-data">{b.farmerId?.mobile}</strong></span>
                        <span>{lang === 'hi' ? 'ग्राम:' : 'Village:'} {b.farmerId?.village}</span>
                        {b.slotId && (
                          <span>{lang === 'hi' ? 'स्लॉट:' : 'Slot:'} <strong className="font-data">{b.slotId.startTime} - {b.slotId.endTime}</strong></span>
                        )}
                        <span>{lang === 'hi' ? 'खाता:' : 'A/C:'} <span className="font-data">{b.farmerId?.bankAccount?.accountNumber}</span></span>
                      </div>
                    </div>

                    <div>
                      {b.status === 'Booked' ? (
                        <button
                          onClick={() => handleCheckin(b._id)}
                          disabled={checkingInId === b._id}
                          className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-xl shadow-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{checkingInId === b._id ? (lang === 'hi' ? 'चेक-इन जारी...' : 'Checking In...') : t.checkInBtn}</span>
                        </button>
                      ) : b.status === 'Procured' ? (
                        <div className="text-xs font-semibold text-emerald-900 bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>{lang === 'hi' ? 'उपार्जन पूर्ण (Procured & Weighed)' : 'Procured & Weighed'}</span>
                        </div>
                      ) : b.status === 'Serving' ? (
                        <div className="text-xs font-semibold text-blue-900 bg-blue-100 border border-blue-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-blue-700" />
                          <span>{lang === 'hi' ? `कांटा पटल पर उपस्थित ${b.queuePosition ? `(#${b.queuePosition})` : ''}` : `At Scale ${b.queuePosition ? `(#${b.queuePosition})` : ''}`}</span>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>{lang === 'hi' ? `आगमन सत्यापित (कांटा क्रम #${b.queuePosition || 1})` : `Arrival Verified (Queue #${b.queuePosition || 1})`}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
