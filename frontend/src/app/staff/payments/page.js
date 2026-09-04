'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Landmark, 
  ShieldCheck, 
  Send 
} from 'lucide-react';

export default function StaffPaymentsPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [user, setUser] = useState(null);
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [utrInputs, setUtrInputs] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/reports');
      if (res.procurements) {
        setProcurements(res.procurements);
      }
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
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
    if (parsed.role !== 'staff' && parsed.role !== 'admin') {
      router.push('/');
      return;
    }
    setUser(parsed);

    fetchRecords();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  const handleMarkPaid = async (paymentId) => {
    const utr = utrInputs[paymentId];
    if (!utr || !utr.trim()) {
      setError(lang === 'hi' ? 'कृपया बैंक आरटीजीएस/यूटीआर संदर्भ संख्या दर्ज करें' : 'Please enter bank RTGS/UTR reference number');
      return;
    }

    setProcessingId(paymentId);
    setError(null);
    setMessage(null);

    try {
      const res = await apiRequest('/api/payments/mark-paid', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentId,
          bankReferenceNumber: utr.trim(),
        }),
      });

      if (res.success) {
        setMessage(lang === 'hi'
          ? `भुगतान सफलता दर्ज! यूटीआर संदर्भ: ${utr.trim()} | किसान को एसएमएस/ईमेल प्रेषित।`
          : `Payment recorded successfully! UTR: ${utr.trim()} | Dispatched notification to farmer.`);
        setUtrInputs((prev) => ({ ...prev, [paymentId]: '' }));
        const mPid = document.getElementById('manualPaymentId');
        const mUtr = document.getElementById('manualUtr');
        if (mPid) mPid.value = '';
        if (mUtr) mUtr.value = '';
        fetchRecords();
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'भुगतान अद्यतन विफल' : 'Failed to update payment status'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-6xl mx-auto">
        {/* Official Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase block">
              {t.govtOfIndia}
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900 mt-1">
              {t.staffPayHeading}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.staffPaySub}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'staff' && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-950 shadow-sm">
                <Landmark className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>{lang === 'hi' ? 'उपार्जन केंद्र:' : 'Mandi Centre:'} <strong className="text-emerald-900 font-data">{user.centreId?.name || 'Assigned Mandi'} {user.centreId?.code ? `(${user.centreId.code})` : ''}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-900">
              <Landmark className="w-4 h-4 text-emerald-800" />
              <span>{lang === 'hi' ? 'PFMS / RTGS प्रत्यक्ष भुगतान' : 'PFMS / RTGS Direct Settlement'}</span>
            </div>
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

        {/* Manual Direct UTR Input Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              {lang === 'hi' ? 'त्वरित यूटीआर प्रविष्टि (Direct UTR Clearance)' : 'Direct UTR Clearance by Voucher ID'}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder={lang === 'hi' ? 'भुगतान वाउचर आईडी (Payment Voucher ID)' : 'Payment Voucher ID'}
              id="manualPaymentId"
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-400 text-xs font-data font-bold text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 shadow-inner"
            />
            <input
              type="text"
              placeholder={lang === 'hi' ? 'बैंक यूटीआर संख्या (उदा. UTR2026090400123)' : 'Bank UTR Ref (e.g. UTR2026090400123)'}
              id="manualUtr"
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-400 text-xs font-data font-bold text-slate-950 uppercase placeholder:text-slate-500 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 shadow-inner"
            />
            <button
              onClick={() => {
                const pid = document.getElementById('manualPaymentId')?.value;
                const utr = document.getElementById('manualUtr')?.value;
                if (!pid || !utr) {
                  setError(lang === 'hi' ? 'कृपया वाउचर आईडी और बैंक यूटीआर नंबर दोनों दर्ज करें' : 'Please provide both Voucher ID and Bank UTR');
                  return;
                }
                setUtrInputs((prev) => ({ ...prev, [pid]: utr }));
                handleMarkPaid(pid);
              }}
              disabled={processingId !== null}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-950 text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{processingId ? (lang === 'hi' ? 'प्रक्रियाधीन...' : 'Processing...') : (lang === 'hi' ? 'यूटीआर दर्ज करें (Clear DBT)' : 'Clear DBT Payment')}</span>
            </button>
          </div>
        </div>

        {/* Procurements and DBT Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            {lang === 'hi' ? 'हाल ही में उपार्जित फसलें व किसान भुगतान सूची' : 'Procured Batches & DBT Ledger'}
          </h3>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs font-medium">
              {lang === 'hi' ? 'ट्रेजरी भुगतान रिकॉर्ड लोड हो रहे हैं...' : 'Loading treasury payment records...'}
            </div>
          ) : procurements.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              {lang === 'hi' ? 'वर्तमान में कोई उपार्जन बैच दर्ज नहीं है।' : 'No procurement records pending settlement.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-3">{t.auditDateCol}</th>
                    <th className="py-3 px-3">{lang === 'hi' ? 'किसान व बैंक खाता' : 'Farmer & Bank Account'}</th>
                    <th className="py-3 px-3">{lang === 'hi' ? 'फसल व वजन' : 'Crop & Net Weight'}</th>
                    <th className="py-3 px-3 text-right">{t.auditTotalCol}</th>
                    <th className="py-3 px-3 text-center">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                    <th className="py-3 px-3 text-right">{lang === 'hi' ? 'ट्रेजरी कार्रवाई' : 'Treasury Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  {procurements.map((p) => {
                    const isPaid = p.payment?.status === 'Paid';
                    return (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-data text-slate-600 block">
                            {new Date(p.createdAt).toLocaleDateString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-data block tracking-tight">
                            ID: {p._id}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {p.farmerId?.name || (lang === 'hi' ? 'किसान' : 'Farmer')}
                          </span>
                          <span className="text-[11px] text-slate-500 font-data">
                            {lang === 'hi' ? 'खाता:' : 'A/C:'} {p.farmerId?.bankAccount?.accountNumber ? `•••• ${p.farmerId.bankAccount.accountNumber.slice(-4)}` : 'Aadhaar DBT'} | {p.farmerId?.bankAccount?.ifscCode || 'IFSC Validated'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">{p.cropType}</span>
                          <span className="text-[11px] text-slate-600 font-data">{p.quantityKg} kg (Grade {p.qualityGrade})</span>
                        </td>
                        <td className="py-3 px-3 text-right font-data font-semibold text-emerald-700 text-sm">
                          ₹{p.totalAmount?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>{lang === 'hi' ? 'भुगतान पूर्ण (DBT Paid)' : 'DBT Settled'}</span>
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                              {lang === 'hi' ? 'ट्रेजरी अनुमोदन हेतु तैयार' : 'Ready for Settlement'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isPaid ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-data font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                {p.payment?.bankReferenceNumber || 'UTR Cleared'}
                              </span>
                              {p.payment?.paidAt && (
                                <span className="text-[9px] text-slate-400 font-data mt-0.5">
                                  {new Date(p.payment.paidAt).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="text"
                                placeholder={t.enterUtrPlaceholder}
                                value={utrInputs[p._id] || ''}
                                onChange={(e) => setUtrInputs({ ...utrInputs, [p._id]: e.target.value })}
                                className="w-36 sm:w-44 px-3 py-1.5 rounded-lg bg-white border border-slate-400 text-xs font-data font-bold text-slate-950 uppercase placeholder:text-slate-500 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 shadow-inner"
                              />
                              <button
                                onClick={() => handleMarkPaid(p._id)}
                                disabled={processingId === p._id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shrink-0 shadow-sm"
                              >
                                {processingId === p._id ? '...' : t.markPaidBtn}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
