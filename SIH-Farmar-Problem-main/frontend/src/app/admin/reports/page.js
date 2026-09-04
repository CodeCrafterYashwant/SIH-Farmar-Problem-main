'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  AlertCircle 
} from 'lucide-react';

export default function AdminReportsPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getThirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };

  const getToday = () => new Date().toISOString().split('T')[0];

  const [from, setFrom] = useState(getThirtyDaysAgo());
  const [to, setTo] = useState(getToday());

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

    fetchReports();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/api/admin/reports/procurement?from=${from}&to=${to}`);
      if (res.procurements) {
        setProcurements(res.procurements);
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'लेखा रिपोर्ट लोड करने में विफलता' : 'Failed to load procurement audit reports'));
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (procurements.length === 0) return;

    const headers = [
      'Token Number',
      'Farmer Name',
      'Mobile',
      'Village',
      'Mandi Centre',
      'Crop',
      'Net Weight (Kg)',
      'Moisture %',
      'Grade',
      'Rate (INR/Kg)',
      'Total Payable (INR)',
      'Payment Status',
      'UTR Ref',
      'Date',
    ];

    const rows = procurements.map((p) => [
      p.bookingId?.tokenNumber || 'N/A',
      p.farmerId?.name || 'N/A',
      p.farmerId?.mobile || 'N/A',
      p.farmerId?.village || 'N/A',
      p.centreId?.name || 'N/A',
      p.cropType,
      p.quantityKg,
      p.moisturePercent,
      p.qualityGrade,
      p.ratePerKg,
      p.totalAmount,
      p.paymentStatus,
      p.utrNumber || 'N/A',
      new Date(p.createdAt).toLocaleDateString('en-IN'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MSP_Procurement_Audit_${from}_to_${to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-7xl mx-auto">
        {/* Official Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase block">
              {t.govtOfIndia}
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900 mt-1">
              {t.adminReportsHeading}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.adminReportsSub}
            </p>
          </div>

          <button
            onClick={exportCSV}
            disabled={procurements.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-sm transition-all active:scale-95 disabled:opacity-40 self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportCsvBtn} ({procurements.length} {lang === 'hi' ? 'रिकॉर्ड' : 'Records'})</span>
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4 text-xs font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">{t.fromDateLabel}:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-data focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">{t.toDateLabel}:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-data focus:outline-none focus:border-emerald-600"
            />
          </div>
          <button
            onClick={fetchReports}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-950 text-white flex items-center gap-1.5 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{t.applyFilterBtn}</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Report Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs font-medium">
              {lang === 'hi' ? 'लेखा परीक्षण रिकॉर्ड लोड हो रहे हैं...' : 'Loading audit records...'}
            </div>
          ) : procurements.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-medium">
              {lang === 'hi' ? 'चयनित समयावधि में कोई खरीद रिकॉर्ड नहीं मिला।' : 'No procurement records found for selected dates.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3">{t.auditDateCol}</th>
                  <th className="py-3 px-3">{t.auditFarmerCol}</th>
                  <th className="py-3 px-3">{t.auditVillageCol}</th>
                  <th className="py-3 px-3">{t.auditCropCol}</th>
                  <th className="py-3 px-3 text-right">{t.auditNetWtCol}</th>
                  <th className="py-3 px-3 text-center">{t.auditMoistureCol}</th>
                  <th className="py-3 px-3 text-center">{t.auditGradeCol}</th>
                  <th className="py-3 px-3 text-right">{t.auditRateCol}</th>
                  <th className="py-3 px-3 text-right">{t.auditTotalCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-normal">
                {procurements.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-data text-slate-600">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{p.farmerId?.name || (lang === 'hi' ? 'किसान' : 'Farmer')}</td>
                    <td className="py-3 px-3 text-slate-600">{p.farmerId?.village || (lang === 'hi' ? 'मध्य प्रदेश' : 'Madhya Pradesh')}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{p.cropType}</td>
                    <td className="py-3 px-3 text-right font-data font-semibold text-slate-900">{p.quantityKg}</td>
                    <td className="py-3 px-3 text-center font-data">{p.moisturePercent}%</td>
                    <td className="py-3 px-3 text-center font-medium text-emerald-800">Grade {p.qualityGrade}</td>
                    <td className="py-3 px-3 text-right font-data text-slate-600">₹{p.ratePerKg}</td>
                    <td className="py-3 px-3 text-right font-data font-semibold text-emerald-700 text-sm">
                      ₹{p.totalAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
