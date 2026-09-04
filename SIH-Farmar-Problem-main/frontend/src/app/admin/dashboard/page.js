'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import { 
  Building2, 
  UserCheck, 
  CalendarCheck, 
  CreditCard, 
  PlusCircle, 
  AlertCircle,
  Clock,
  Scale
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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
    const parsed = JSON.parse(rawUser);
    if (parsed.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await apiRequest('/api/admin/dashboard');
        if (res.stats) {
          setStats(res.stats);
        }
      } catch (err) {
        setError(err.message || (lang === 'hi' ? 'डैशबोर्ड डेटा लोड करने में त्रुटि' : 'Failed to load dashboard metrics'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  return (
    <div className="min-h-screen bg-[#f3f4f6] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-7xl mx-auto">
        {/* Official Header (Without redundant inner subnav) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wide block">
              {lang === 'hi' ? 'राज्य स्तरीय उपार्जन नियंत्रण कक्ष | प्रशासक पटल' : 'State Procurement Command Directorate | Admin HQ'}
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-blue-950 mt-0.5">
              {t.adminDashHeading}
            </h1>
            <p className="text-xs text-slate-600 font-normal mt-0.5">
              {t.adminDashSub}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/centres"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-300 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-blue-950" />
              <span>{t.addCentreBtn}</span>
            </Link>
            <Link
              href="/admin/slots"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t.generateSlotsBtn}</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-600 text-sm">
            <div className="w-8 h-8 border-3 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            {lang === 'hi' ? 'राज्य स्तरीय उपार्जन सांख्यिकी लोड हो रही है...' : 'Loading state procurement metrics...'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-t-4 border-t-blue-950 interactive-card">
                <div className="flex items-center justify-between text-slate-600 mb-2">
                  <span className="text-xs font-semibold">{t.totalCentresLabel}</span>
                  <Building2 className="w-5 h-5 text-blue-950" />
                </div>
                <span className="text-3xl font-semibold text-blue-950 font-data">{stats?.totalCentres || 0}</span>
                <span className="block text-[11px] text-slate-500 font-normal mt-1">{t.totalCentresSub}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-t-4 border-t-emerald-600 interactive-card">
                <div className="flex items-center justify-between text-slate-600 mb-2">
                  <span className="text-xs font-semibold">{t.registeredFarmersLabel}</span>
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-3xl font-semibold text-emerald-700 font-data">{stats?.totalFarmers || 0}</span>
                <span className="block text-[11px] text-slate-500 font-normal mt-1">{t.registeredFarmersSub}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-t-4 border-t-amber-500 interactive-card">
                <div className="flex items-center justify-between text-slate-600 mb-2">
                  <span className="text-xs font-semibold">{t.totalBookingsLabel}</span>
                  <CalendarCheck className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-3xl font-semibold text-amber-700 font-data">{stats?.totalBookings || 0}</span>
                <span className="block text-[11px] text-slate-500 font-normal mt-1">{t.totalBookingsSub}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-t-4 border-t-indigo-600 interactive-card">
                <div className="flex items-center justify-between text-slate-600 mb-2">
                  <span className="text-xs font-semibold">{t.totalProcurementsLabel}</span>
                  <Scale className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-3xl font-semibold text-indigo-700 font-data">{stats?.totalProcurements || 0}</span>
                <span className="block text-[11px] text-slate-500 font-normal mt-1">{t.totalProcurementsSub}</span>
              </div>
            </div>

            {/* Treasury & DBT Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-emerald-300 rounded-2xl p-6 shadow-sm interactive-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-blue-950">{t.disbursedFundsLabel}</h3>
                    <span className="text-xs text-slate-600 font-normal">{t.disbursedFundsSub}</span>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-data font-semibold text-emerald-700 mb-2">
                  ₹{(stats?.totalDisbursed || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-600 font-normal">
                  {lang === 'hi' ? 'सफल अंतरित वाउचर: ' : 'Total paid vouchers: '}
                  <strong className="text-emerald-800 font-semibold">{stats?.paidPayments || 0}</strong>
                </div>
              </div>

              <div className="bg-white border border-amber-300 rounded-2xl p-6 shadow-sm interactive-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-blue-950">{t.pendingSettlementsLabel}</h3>
                    <span className="text-xs text-slate-600 font-normal">{t.pendingSettlementsSub}</span>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-data font-semibold text-amber-700 mb-2">
                  ₹{(stats?.totalPendingAmount || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-600 font-normal">
                  {lang === 'hi' ? 'लंबित वाउचर संख्या: ' : 'Pending voucher count: '}
                  <strong className="text-amber-800 font-semibold">{stats?.pendingPayments || 0}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
