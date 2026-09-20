'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../utils/api';
import { translations, getStoredLang } from '../../utils/translations';
import { CreditCard, CheckCircle2, Clock, AlertCircle, ShieldCheck, ArrowDownLeft } from 'lucide-react';

export default function PaymentsPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
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

    const fetchPayments = async () => {
      try {
        const res = await apiRequest('/api/payments/my');
        if (res.payments) {
          setPayments(res.payments);
        }
      } catch (err) {
        if (err.status === 401 || err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('token') || err.message?.includes('Token')) {
          router.replace('/');
        } else {
          setError(err.message || (lang === 'hi' ? 'भुगतान रिकॉर्ड लोड करने में त्रुटि' : 'Failed to load payments'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  return (
    <div className="min-h-screen bg-[#f3f4f6] py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b-2 border-slate-200 p-5 rounded-2xl mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wide block">
              {lang === 'hi' ? 'खाद्य एवं नागरिक आपूर्ति संचालनालय | डीबीटी पासबुक' : 'Directorate of Food & Civil Supplies | DBT Passbook'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-blue-950">
              {lang === 'hi' ? 'प्रत्यक्ष लाभ अंतरण (DBT) भुगतान रिकॉर्ड' : 'Direct Benefit Transfer (DBT) Payment Ledger'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {lang === 'hi' 
                ? 'सरकारी समर्थन मूल्य पर उपार्जित उपज का आधार लिंक बैंक खाते में सीधे भुगतान का लेखा-जोखा' 
                : 'Official ledger of crop sales proceeds credited directly to Aadhaar-linked bank accounts'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-black self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>100% PFMS / RTGS Verified</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-bold shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs font-bold">
              {lang === 'hi' ? 'भुगतान विवरण लोड हो रहा है...' : 'Loading DBT transaction records...'}
            </span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-900 mb-1">
              {lang === 'hi' ? 'वर्तमान में कोई भुगतान वाउचर नहीं है' : 'No Payment Vouchers Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lang === 'hi' 
                ? 'मंडी में आपकी फसल की तौल एवं गुणवत्ता जांच के उपरांत यहाँ भुगतान वाउचर स्वतः जारी होगा।' 
                : 'Payment vouchers are automatically generated here after your crop has been inspected and weighed at the mandi scale.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => {
              const isPaid = p.status === 'Paid';
              return (
                <div
                  key={p._id}
                  className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-700 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      <ArrowDownLeft className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          ₹{p.amount?.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-black ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isPaid 
                            ? (lang === 'hi' ? '✓ अंतरित (Paid via DBT)' : '✓ Disbursed (Paid)') 
                            : (lang === 'hi' ? 'प्रक्रियाधीन (Pending Clearance)' : 'Pending Treasury Clearance')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>
                          <span className="text-slate-400">{lang === 'hi' ? 'वाउचर संख्या:' : 'Voucher ID:'} </span>
                          <span className="font-mono font-bold text-slate-800">{p._id}</span>
                        </p>
                        {p.bankReferenceNumber ? (
                          <p className="text-emerald-800 font-bold">
                            <span>{lang === 'hi' ? 'ट्रेजरी यूटीआर संदर्भ: ' : 'Bank UTR Ref: '}</span>
                            <span className="font-mono text-emerald-950 font-black">{p.bankReferenceNumber}</span>
                          </p>
                        ) : (
                          <p className="text-amber-800 font-semibold">
                            {lang === 'hi' ? 'ट्रेजरी द्वारा आरटीजीएस यूटीआर शीघ्र जारी किया जाएगा' : 'RTGS transmission scheduled by treasury'}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500">
                          {lang === 'hi' ? 'दिनांक: ' : 'Date: '} 
                          {new Date(p.createdAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <span className="text-[11px] text-slate-400 block mb-0.5">
                      {lang === 'hi' ? 'अंतरित बैंक खाता:' : 'Credited Bank A/C:'}
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-800 block">
                      •••• •••• •••• {p.procurementId?.bookingId?.farmerId?.bankAccount?.accountNumber?.slice(-4) || 'DBT'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Aadhaar Payment Bridge (APB)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
