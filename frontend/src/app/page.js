'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiRequest } from '../utils/api';
import { translations, getStoredLang } from '../utils/translations';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  LogIn, 
  UserPlus, 
  Wheat, 
  Building2, 
  Clock, 
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  Scale,
  FileCheck2,
  FileText,
  Landmark,
  KeyRound,
  ArrowRight,
  Mic
} from 'lucide-react';
import Chatbot from '../components/Chatbot';

export default function UnifiedGovtPortal() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [activeTab, setActiveTab] = useState('farmer'); // 'farmer' | 'staff' | 'admin'

  // Farmer login state
  const [farmerId, setFarmerId] = useState('');
  const [farmerPassword, setFarmerPassword] = useState('');
  const [farmerLoading, setFarmerLoading] = useState(false);
  const [farmerError, setFarmerError] = useState(null);

  // Staff login state
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState(null);

  // Admin login state
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('AdminPass123!');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);

  // Role Mismatch Modal State
  const [roleMismatchModal, setRoleMismatchModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetSection: '', // 'farmer' | 'staff' | 'admin'
  });

  const [liveMsp, setLiveMsp] = useState({
    wheat: 22.75,
    paddy: 21.83,
    soybean: 46.00,
    mustard: 56.50,
  });

  useEffect(() => {
    setLang(getStoredLang());
    const handleLangChange = () => setLang(getStoredLang());
    window.addEventListener('languageChange', handleLangChange);

    const fetchLiveMsp = async () => {
      try {
        const res = await apiRequest('/api/centres');
        if (res.centres && res.centres.length > 0) {
          for (const c of res.centres) {
            if (c.ratePerKg) {
              const w = typeof c.ratePerKg.get === 'function' ? c.ratePerKg.get('Wheat') : (c.ratePerKg.Wheat || c.ratePerKg.wheat);
              const p = typeof c.ratePerKg.get === 'function' ? c.ratePerKg.get('Paddy') : (c.ratePerKg.Paddy || c.ratePerKg.paddy);
              const s = typeof c.ratePerKg.get === 'function' ? c.ratePerKg.get('Soybean') : (c.ratePerKg.Soybean || c.ratePerKg.soybean);
              const m = typeof c.ratePerKg.get === 'function' ? c.ratePerKg.get('Mustard') : (c.ratePerKg.Mustard || c.ratePerKg.mustard);
              if (w) {
                setLiveMsp({
                  wheat: Number(w) || 22.75,
                  paddy: Number(p) || 21.83,
                  soybean: Number(s) || 46.00,
                  mustard: Number(m) || 56.50,
                });
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Live MSP fetch warning:', err);
      }
    };
    fetchLiveMsp();

    const handleMspUpdate = () => fetchLiveMsp();
    window.addEventListener('centreMspUpdated', handleMspUpdate);

    const handleStorageUpdate = (e) => {
      if (e.key === 'sih_latest_msp') {
        fetchLiveMsp();
      }
    };
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('centreMspUpdated', handleMspUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const t = translations[lang] || translations.hi;

  // Handle Farmer Login
  const handleFarmerLogin = async (e) => {
    e.preventDefault();
    setFarmerLoading(true);
    setFarmerError(null);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: farmerId.trim(), password: farmerPassword }),
      });

      if (res.user && res.user.role !== 'farmer') {
        const isAdm = res.user.role === 'admin';
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: isAdm ? t.useAdminNotice : t.useStaffNotice,
          targetSection: isAdm ? 'admin' : 'staff',
        });
        return;
      }

      if (res.token) {
        localStorage.setItem('sih_token', res.token);
        localStorage.setItem('sih_user', JSON.stringify(res.user));
        window.dispatchEvent(new Event('authChange'));
        router.push('/my-bookings');
      }
    } catch (err) {
      if (err.message && (err.message.includes('Mandi Staff') || err.message.includes('USE_STAFF_SECTION') || err.message.includes('Staff section'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useStaffNotice,
          targetSection: 'staff',
        });
      } else if (err.message && (err.message.includes('Administrator') || err.message.includes('USE_ADMIN_SECTION') || err.message.includes('Admin section'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useAdminNotice,
          targetSection: 'admin',
        });
      } else {
        setFarmerError(err.message || (lang === 'hi' ? 'लॉगिन विफल। कृपया अपना मोबाइल नंबर और पासवर्ड जांचें।' : 'Login failed. Please check your credentials.'));
      }
    } finally {
      setFarmerLoading(false);
    }
  };

  // Handle Staff Login
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setStaffLoading(true);
    setStaffError(null);

    try {
      const res = await apiRequest('/api/auth/staff-login', {
        method: 'POST',
        body: JSON.stringify({ 
          username: staffUsername.trim().toLowerCase(), 
          password: staffPassword,
          expectedRole: 'staff',
        }),
      });

      if (res.user && res.user.role === 'farmer') {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useFarmerNotice,
          targetSection: 'farmer',
        });
        return;
      }

      if (res.user && res.user.role === 'admin') {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useAdminNotice,
          targetSection: 'admin',
        });
        return;
      }

      if (res && res.token) {
        localStorage.setItem('sih_token', res.token);
        localStorage.setItem('sih_user', JSON.stringify(res.user));
        window.dispatchEvent(new Event('authChange'));
        router.push('/staff/today');
      }
    } catch (err) {
      if (err.message && (err.message.includes('Farmer') || err.message.includes('USE_FARMER_SECTION') || err.message.includes('किसान'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useFarmerNotice,
          targetSection: 'farmer',
        });
      } else if (err.message && (err.message.includes('Administrator') || err.message.includes('USE_ADMIN_SECTION') || err.message.includes('प्रशासक'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useAdminNotice,
          targetSection: 'admin',
        });
      } else {
        setStaffError(err.message || (lang === 'hi' ? 'स्टाफ लॉगिन विफल। यूजरनेम अथवा पासवर्ड त्रुटिपूर्ण है।' : 'Staff login failed. Invalid username or password.'));
      }
    } finally {
      setStaffLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);

    try {
      const res = await apiRequest('/api/auth/staff-login', {
        method: 'POST',
        body: JSON.stringify({ 
          username: adminUsername.trim().toLowerCase(), 
          password: adminPassword,
          expectedRole: 'admin',
        }),
      });

      if (res.user && res.user.role === 'farmer') {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useFarmerNotice,
          targetSection: 'farmer',
        });
        return;
      }

      if (res.user && res.user.role === 'staff') {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useStaffNotice,
          targetSection: 'staff',
        });
        return;
      }

      if (res && res.token) {
        localStorage.setItem('sih_token', res.token);
        localStorage.setItem('sih_user', JSON.stringify(res.user));
        window.dispatchEvent(new Event('authChange'));
        router.push('/admin/dashboard');
      }
    } catch (err) {
      if (err.message && (err.message.includes('Farmer') || err.message.includes('USE_FARMER_SECTION') || err.message.includes('किसान'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useFarmerNotice,
          targetSection: 'farmer',
        });
      } else if (err.message && (err.message.includes('Mandi Staff') || err.message.includes('USE_STAFF_SECTION') || err.message.includes('स्टाफ'))) {
        setRoleMismatchModal({
          isOpen: true,
          title: t.wrongPortalTitle,
          message: t.useStaffNotice,
          targetSection: 'staff',
        });
      } else {
        setAdminError(err.message || (lang === 'hi' ? 'प्रशासक लॉगिन विफल। कृपया क्रेडेंशियल जांचें।' : 'Admin login failed. Please verify credentials.'));
      }
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-body">
      {/* 1. Official News & MSP Announcement Ticker */}
      <div className="bg-amber-500 text-blue-950 font-medium text-xs py-2 px-4 shadow-sm border-b border-amber-600 flex items-center gap-3 overflow-hidden">
        <span className="bg-blue-950 text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded shrink-0 shadow-sm font-body">
          {t.tickerPrefix}
        </span>
        <div className="whitespace-nowrap overflow-hidden text-ellipsis flex-1">
          <span className="animate-marquee font-medium text-slate-950 font-body">
            {lang === 'hi'
              ? `रबी एवं खरीफ न्यूनतम समर्थन मूल्य (MSP) 2026: गेहूं (Wheat) ₹${liveMsp.wheat}/किग्रा (₹${(liveMsp.wheat * 100).toLocaleString('en-IN')}/क्विंटल) | धान (Paddy) ₹${liveMsp.paddy}/किग्रा | सोयाबीन (Soybean) ₹${liveMsp.soybean}/किग्रा | सरसों (Mustard) ₹${liveMsp.mustard}/किग्रा। उपार्जन केंद्र पर मूल खसरा/खतौनी, आधार व बैंक पासबुक अवश्य लाएं।`
              : `Rabi & Kharif MSP Procurement 2026: Wheat ₹${liveMsp.wheat}/kg (₹${(liveMsp.wheat * 100).toLocaleString('en-IN')}/qtl) | Paddy ₹${liveMsp.paddy}/kg | Soybean ₹${liveMsp.soybean}/kg | Mustard ₹${liveMsp.mustard}/kg. Please carry original Land Khasra/Khatauni, Aadhaar & Bank Passbook to the Mandi Gate.`}
          </span>
        </div>
      </div>

      {/* 2. Hero Section with 3 Distinct Font Hierarchy */}
      <section className="relative bg-gradient-to-b from-blue-950 via-[#0d2238] to-blue-950 text-white overflow-hidden py-14 px-4 sm:px-8 border-b-4 border-amber-500">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-300 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{t.heroBadge}</span>
            </div>

            {/* Font Style 1: Merriweather Display Serif for Headline */}
            <h1 className="font-display text-2xl sm:text-4xl lg:text-[42px] font-bold text-white leading-tight">
              {t.heroHeading}
            </h1>

            {/* Font Style 2: Plus Jakarta Sans for Body text (Regular weight, pleasant reading) */}
            <p className="font-body text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              {t.heroDescription}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/centres"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-blue-950 font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>{t.heroCtaBook}</span>
              </Link>
              <Link
                href="/centres"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-xs sm:text-sm transition-all flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-blue-300" />
                <span>{t.heroCtaCentres}</span>
              </Link>

              {/* Voice AI Prompt Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>{lang === 'hi' ? `बोलकर पूछें: "गेहूं का MSP क्या है? (वर्तमान: ₹${liveMsp.wheat}/किग्रा)"` : `Ask by Voice: "What is Wheat MSP? (Live: ₹${liveMsp.wheat}/kg)"`}</span>
              </div>
            </div>

            {/* Font Style 3: Tabular Numbers / JetBrains Mono for Data Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/60">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 interactive-card">
                <span className="text-[11px] text-slate-400 font-normal block font-body">{t.heroStat1Label}</span>
                <span className="text-base sm:text-lg font-semibold text-amber-400 font-data">{t.heroStat1Val}</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 interactive-card">
                <span className="text-[11px] text-slate-400 font-normal block font-body">{t.heroStat2Label}</span>
                <span className="text-base sm:text-lg font-semibold text-emerald-400 font-data">{t.heroStat2Val}</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 interactive-card">
                <span className="text-[11px] text-slate-400 font-normal block font-body">{t.heroStat3Label}</span>
                <span className="text-base sm:text-lg font-semibold text-sky-400 font-data">{t.heroStat3Val}</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 interactive-card">
                <span className="text-[11px] text-slate-400 font-normal block font-body">{t.heroStat4Label}</span>
                <span className="text-base sm:text-lg font-semibold text-emerald-400 font-data">{t.heroStat4Val}</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Authentic Agricultural Imagery & Seal */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
              <Image
                src="/images/kisan_hero.jpg"
                alt="Indian Farmer at Agricultural Procurement Mandi"
                fill
                priority
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <div className="text-white text-xs">
                  <span className="font-semibold text-amber-300 block font-body">कृषि उपज मंडी समिति | Krishi Upaj Mandi</span>
                  <span className="text-[11px] text-slate-300 font-normal">पारदर्शी डिजिटल तौल व 48 घंटे में सीधी डीबीटी अदायगी</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Central Interactive 3-Role SSO Gateway */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 -mt-8 relative z-20 mb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header of SSO Card */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block font-body">
                {t.portalGatewayTitle}
              </span>
              <p className="text-xs text-slate-600 font-normal mt-0.5">
                {t.portalGatewaySubtitle}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 font-medium self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              <span>256-Bit SSL Secured</span>
            </div>
          </div>

          {/* 3 Role Selection Tabs (Gentle, interactive buttons) */}
          <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('farmer');
                setFarmerError(null);
              }}
              className={`py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                activeTab === 'farmer'
                  ? 'bg-emerald-700 text-white shadow-sm font-semibold'
                  : 'text-slate-700 hover:bg-slate-200 font-normal'
              }`}
            >
              <Wheat className="w-4 h-4" />
              <span>{t.farmerTab}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('staff');
                setStaffError(null);
              }}
              className={`py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'bg-blue-950 text-white shadow-sm font-semibold'
                  : 'text-slate-700 hover:bg-slate-200 font-normal'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{t.staffTab}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('admin');
                setAdminError(null);
              }}
              className={`py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'text-slate-700 hover:bg-slate-200 font-normal'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>{t.adminTab}</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="p-6 sm:p-8">
            {/* TAB 1: FARMER LOGIN */}
            {activeTab === 'farmer' && (
              <div>
                <div className="mb-5">
                  <h3 className="font-display text-lg font-bold text-blue-950">{t.farmerLoginTitle}</h3>
                  <p className="text-xs text-slate-600 font-normal mt-0.5">{t.farmerLoginDesc}</p>
                </div>

                {farmerError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{farmerError}</span>
                  </div>
                )}

                <form onSubmit={handleFarmerLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.identifierLabel} *
                    </label>
                    <input
                      type="text"
                      required
                      value={farmerId}
                      onChange={(e) => setFarmerId(e.target.value)}
                      placeholder={t.identifierPlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.passwordLabel} *
                    </label>
                    <input
                      type="password"
                      required
                      value={farmerPassword}
                      onChange={(e) => setFarmerPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={farmerLoading}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{farmerLoading ? '...' : t.loginBtnFarmer}</span>
                  </button>
                </form>

                {/* Farmer Registration CTA */}
                <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-xs font-semibold text-emerald-950 block">
                      {t.newFarmerPrompt}
                    </span>
                    <span className="text-[11px] text-emerald-800 font-normal">
                      आधार व बैंक खाते के साथ 2 मिनट में निःशुल्क पंजीयन कराएं
                    </span>
                  </div>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto flex items-center gap-1 active:scale-95"
                  >
                    <span>{t.registerFarmerBtn}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: STAFF LOGIN */}
            {activeTab === 'staff' && (
              <div>
                <div className="mb-5">
                  <h3 className="font-display text-lg font-bold text-blue-950">{t.staffLoginTitle}</h3>
                  <p className="text-xs text-slate-600 font-normal mt-0.5">{t.staffLoginDesc}</p>
                </div>

                {/* Staff compliance notice */}
                <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-amber-900 mb-0.5">
                      {t.staffNoticeHeading}
                    </strong>
                    <span className="leading-relaxed font-normal text-amber-900">
                      {t.staffNotice}
                    </span>
                  </div>
                </div>

                {staffError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{staffError}</span>
                  </div>
                )}

                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.usernameLabel} *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      placeholder={t.usernamePlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-950 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.passwordLabel} *
                    </label>
                    <input
                      type="password"
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-950 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={staffLoading}
                    className="w-full py-3 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {staffLoading 
                        ? (lang === 'hi' ? 'प्रमाणीकरण जारी...' : 'Authenticating...') 
                        : (t.loginBtnStaff || (lang === 'hi' ? 'मंडी स्टाफ डेस्क में लॉगिन करें' : 'Login to Mandi Staff Desk'))}
                    </span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: ADMIN LOGIN */}
            {activeTab === 'admin' && (
              <div>
                <div className="mb-5">
                  <h3 className="font-display text-lg font-bold text-blue-950">{t.adminLoginTitle}</h3>
                  <p className="text-xs text-slate-600 font-normal mt-0.5">{t.adminLoginDesc}</p>
                </div>

                {/* Convenient 1-Click Fill Credentials Card */}
                <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-800 shrink-0" />
                    <span className="font-normal">{t.adminDemoHint}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminUsername('admin');
                      setAdminPassword('AdminPass123!');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-medium transition-colors shrink-0 self-start sm:self-auto"
                  >
                    {lang === 'hi' ? 'स्वतः भरें (Fill Demo)' : 'Auto-Fill'}
                  </button>
                </div>

                {adminError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{adminError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.adminUsernameLabel} *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder={t.adminUsernamePlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.passwordLabel} *
                    </label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{adminLoading ? '...' : t.loginBtnAdmin}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Step-by-Step Farmer Procurement Process */}
      <section id="guidelines" className="max-w-7xl mx-auto px-4 sm:px-8 py-12 border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-semibold text-blue-900 uppercase tracking-widest block mb-1 font-body">
            सरल एवं सुगम प्रक्रिया
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-blue-950">
            {t.guideHeading}
          </h2>
          <p className="font-body text-xs sm:text-sm text-slate-600 font-normal mt-2">
            {t.guideSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm interactive-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base mb-4">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-blue-950 mb-2">{t.step1Title}</h3>
            <p className="font-body text-xs text-slate-600 font-normal leading-relaxed">{t.step1Desc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm interactive-card">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-base mb-4">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-blue-950 mb-2">{t.step2Title}</h3>
            <p className="font-body text-xs text-slate-600 font-normal leading-relaxed">{t.step2Desc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm interactive-card">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-blue-950 mb-2">{t.step3Title}</h3>
            <p className="font-body text-xs text-slate-600 font-normal leading-relaxed">{t.step3Desc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm interactive-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-blue-950 mb-2">{t.step4Title}</h3>
            <p className="font-body text-xs text-slate-600 font-normal leading-relaxed">{t.step4Desc}</p>
          </div>
        </div>
      </section>

      {/* 5. Documents Required Section */}
      <section className="bg-slate-100 py-12 px-4 sm:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider block font-body">
              आवश्यक तैयारी
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-blue-950">
              {t.docsHeading}
            </h2>
            <p className="font-body text-xs text-slate-600 font-normal mt-1">
              {t.docsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm interactive-card">
              <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-blue-950 font-body">
                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                <span>{t.doc1Title}</span>
              </div>
              <p className="text-xs text-slate-600 font-normal">{t.doc1Desc}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm interactive-card">
              <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-blue-950 font-body">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>{t.doc2Title}</span>
              </div>
              <p className="text-xs text-slate-600 font-normal">{t.doc2Desc}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm interactive-card">
              <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-blue-950 font-body">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>{t.doc3Title}</span>
              </div>
              <p className="text-xs text-slate-600 font-normal">{t.doc3Desc}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm interactive-card">
              <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-blue-950 font-body">
                <CalendarCheck className="w-4 h-4 text-emerald-700" />
                <span>{t.doc4Title}</span>
              </div>
              <p className="text-xs text-slate-600 font-normal">{t.doc4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Official Government Footer */}
      <footer className="bg-blue-950 text-white py-8 px-4 sm:px-8 text-xs border-t-4 border-amber-500 font-body">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <span className="font-display font-bold text-amber-400 block text-sm mb-1">
              {t.footerGovt}
            </span>
            <p className="text-blue-200 text-[11px] font-normal max-w-2xl">
              {t.footerCopyright}
            </p>
            <p className="text-slate-400 text-[10px] font-normal mt-1">
              {t.footerDisclaimer}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center font-serif text-amber-400 font-bold border border-amber-500">
              GOI
            </div>
            <div className="text-left text-[11px]">
              <span className="font-semibold text-white block">e-NAM Integrated</span>
              <span className="text-emerald-400 font-medium">100% MSP Guaranteed</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Role Mismatch Modal Popup */}
      {roleMismatchModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {roleMismatchModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.wrongPortalSub}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 mb-5 leading-relaxed font-medium">
              {roleMismatchModal.message}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRoleMismatchModal({ ...roleMismatchModal, isOpen: false })}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                {t.closeBtn}
              </button>
              {roleMismatchModal.targetSection && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(roleMismatchModal.targetSection);
                    setRoleMismatchModal({ ...roleMismatchModal, isOpen: false });
                    const sectionEl = document.getElementById('portal-login');
                    if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {roleMismatchModal.targetSection === 'staff'
                      ? t.goToStaffBtn
                      : roleMismatchModal.targetSection === 'admin'
                      ? t.goToAdminBtn
                      : t.goToFarmerBtn}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice & Text Chatbot (Accessible to all visitors without login) */}
      <Chatbot />
    </div>
  );
}
