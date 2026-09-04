'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Megaphone, 
  FileText,
  Landmark 
} from 'lucide-react';

export default function StaffQueuePage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [user, setUser] = useState(null);
  const [centres, setCentres] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [callingBookingId, setCallingBookingId] = useState(null);
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
          let defaultCentre;
          if (parsedUser.role === 'staff' && parsedUser.centreId) {
            defaultCentre = parsedUser.centreId?._id || parsedUser.centreId;
          } else {
            const storedCentre = typeof window !== 'undefined' ? localStorage.getItem('sih_selected_centre') : null;
            defaultCentre = storedCentre || res.centres[0]._id;
          }
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

  const fetchLiveQueue = async (cId) => {
    const targetCentre = cId || selectedCentreId;
    if (!targetCentre) return;

    try {
      const res = await apiRequest(`/api/queue/live?centreId=${targetCentre}`);
      const data = res?.data || res;
      setQueueData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCentreId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sih_selected_centre', selectedCentreId);
      }
      fetchLiveQueue(selectedCentreId);
      const interval = setInterval(() => {
        fetchLiveQueue(selectedCentreId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedCentreId]);

  const handleCallNext = async () => {
    if (!selectedCentreId) return;
    setCallingNext(true);
    setMessage(null);
    setError(null);

    try {
      const res = await apiRequest('/api/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ centreId: selectedCentreId }),
      });

      if (res.success) {
        const farmerName = res.booking?.farmerName || res.serving?.farmerName || 'Farmer';
        const tokenNo = res.booking?.tokenNumber || res.serving?.tokenNumber || '';
        setMessage(lang === 'hi'
          ? `किसान '${farmerName}' [टोकन: ${tokenNo}] को कांटे पर बुलाया गया!`
          : `Farmer '${farmerName}' [Token: ${tokenNo}] called to weighbridge scale!`);
        fetchLiveQueue(selectedCentreId);
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'अगला टोकन बुलाने में विफलता' : 'Failed to call next token'));
    } finally {
      setCallingNext(false);
    }
  };

  const handleWeighFarmer = async (bookingId) => {
    if (!selectedCentreId) return;
    setCallingBookingId(bookingId);
    setMessage(null);
    setError(null);

    try {
      const res = await apiRequest('/api/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ centreId: selectedCentreId, bookingId }),
      });

      if (res.success) {
        fetchLiveQueue(selectedCentreId);
        router.push(`/staff/procurement?bookingId=${bookingId}`);
      } else {
        setError(res.message || (lang === 'hi' ? 'कांटे पर बुलाने में विफलता' : 'Failed to move farmer to scale'));
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'कांटे पर बुलाने में विफलता' : 'Failed to move farmer to scale'));
    } finally {
      setCallingBookingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase block">
              {t.govtOfIndia}
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900 mt-1">
              {t.staffQueueHeading}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.staffQueueSub}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'staff' ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-950 shadow-sm">
                <Landmark className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>{lang === 'hi' ? 'उपार्जन केंद्र:' : 'Mandi Centre:'} <strong className="text-emerald-900 font-data">{user.centreId?.name || centres.find(c => c._id === selectedCentreId)?.name || 'Mandi'} {user.centreId?.code ? `(${user.centreId.code})` : ''}</strong></span>
              </div>
            ) : centres.length > 0 && (
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
              >
                {centres.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleCallNext}
              disabled={callingNext || (queueData?.totalWaiting || 0) === 0}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              <span>{callingNext ? (lang === 'hi' ? 'बुलाया जा रहा है...' : 'Calling...') : t.callNextBtn}</span>
            </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Scale Display */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-800" />
                <span>{t.servingNow}</span>
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                {lang === 'hi' ? 'तौल हेतु तैयार' : 'Ready for Weighing'}
              </span>
            </div>

            {queueData?.currentlyServing ? (
              <div className="bg-emerald-50/50 border border-emerald-300 rounded-2xl p-6 text-center">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest block">
                  {lang === 'hi' ? 'कांटे पर आमंत्रित टोकन' : 'CURRENT TOKEN AT SCALE'}
                </span>
                <span className="text-4xl sm:text-5xl font-data font-semibold text-slate-900 tracking-wider block my-2">
                  {queueData.currentlyServing.tokenNumber}
                </span>

                <div className="inline-block bg-white border border-emerald-200 px-5 py-2.5 rounded-xl text-left shadow-sm my-2">
                  <div className="text-sm font-semibold text-slate-900">
                    {lang === 'hi' ? 'किसान:' : 'Farmer:'} {queueData.currentlyServing.farmerName} ({lang === 'hi' ? 'कांटा क्रम' : 'Queue'} #{queueData.currentlyServing.queuePosition})
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {lang === 'hi' ? 'ग्राम:' : 'Village:'} {queueData.currentlyServing.village || (lang === 'hi' ? 'मंडी स्थानीय क्षेत्र' : 'Local Mandi Area')}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={`/staff/procurement?bookingId=${queueData.currentlyServing.bookingId}`}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t.markCompletedBtn} →</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Scale className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'कांटा वर्तमान में रिक्त है' : 'Scale is currently vacant'}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {lang === 'hi' ? 'ऊपर "कांटे पर अगला किसान बुलाएं" बटन पर क्लिक करें।' : 'Click "Call Next Farmer" button above to proceed.'}
                </p>
              </div>
            )}
          </div>

          {/* Waiting Queue */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                {t.queueWaiting} ({queueData?.totalWaiting || 0})
              </h3>
              <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                {lang === 'hi' ? 'क्रमबद्ध' : 'FIFO Order'}
              </span>
            </div>

            {queueData?.waitingList && queueData.waitingList.length > 0 ? (
              <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
                {queueData.waitingList.map((item) => (
                  <div
                    key={item.bookingId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-data font-semibold text-xs shrink-0">
                        #{item.queuePosition}
                      </span>
                      <div>
                        <span className="font-data font-semibold text-slate-900 block">{item.tokenNumber}</span>
                        <span className="text-[11px] text-slate-500">{item.farmerName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {lang === 'hi' ? 'प्रतीक्षारत' : 'Waiting'}
                      </span>
                      <button
                        onClick={() => handleWeighFarmer(item.bookingId)}
                        disabled={callingBookingId === item.bookingId || callingNext}
                        className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                        title={lang === 'hi' ? 'कांटे पर बुलाएं व तौल पर्ची दर्ज करें' : 'Call to Scale & Record Weight'}
                      >
                        <span>{callingBookingId === item.bookingId ? '...' : (lang === 'hi' ? 'तौल करें' : 'Weigh')} →</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                <p className="mb-2 font-medium">{lang === 'hi' ? 'वर्तमान में कोई किसान प्रतीक्षारत नहीं है।' : 'No farmers currently in waiting queue.'}</p>
                <Link
                  href="/staff/today"
                  className="inline-flex items-center gap-1 text-emerald-800 font-semibold hover:underline text-xs"
                >
                  <span>{lang === 'hi' ? 'गेट पास पर आगमन चेक-इन करें →' : 'Gate Arrivals Check-In →'}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
