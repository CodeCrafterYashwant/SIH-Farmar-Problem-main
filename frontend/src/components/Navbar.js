'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { translations, getStoredLang, setStoredLang } from '../utils/translations';
import { 
  PhoneCall, 
  Globe, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Landmark, 
  Clock, 
  Activity, 
  FileText, 
  CreditCard, 
  Building2, 
  Users, 
  CalendarCheck, 
  FileSpreadsheet, 
  TrendingUp,
  UserPlus,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('hi');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // 'small', 'normal', 'large'

  // Load user and language
  const refreshUserData = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('sih_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    setLang(getStoredLang());
    refreshUserData();

    const handleLangChange = () => setLang(getStoredLang());
    const handleAuthChange = () => refreshUserData();

    window.addEventListener('languageChange', handleLangChange);
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [pathname]);

  const toggleLanguage = () => {
    const nextLang = lang === 'hi' ? 'en' : 'hi';
    setStoredLang(nextLang);
    setLang(nextLang);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sih_token');
      localStorage.removeItem('sih_user');
      setUser(null);
      window.dispatchEvent(new Event('authChange'));
      window.location.href = '/';
    }
  };

  const handleFontResize = (size) => {
    setFontSize(size);
    if (typeof document !== 'undefined') {
      if (size === 'small') {
        document.documentElement.style.fontSize = '14px';
      } else if (size === 'large') {
        document.documentElement.style.fontSize = '18px';
      } else {
        document.documentElement.style.fontSize = '16px';
      }
    }
  };

  const t = translations[lang] || translations.en;
  const isFarmer = user?.role === 'farmer';
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
      {/* Indian Tricolor Ribbon */}
      <div className="gov-tricolor-strip w-full"></div>

      {/* Top Accessibility & Ministry Helpline Bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-8 py-1 text-[11px] text-slate-700">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Official Govt Tag */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900">{t.govtOfIndia}</span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-600 font-medium">{t.nationalPortal}</span>
          </div>

          {/* Accessibility & Helpline & Language */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Toll-Free Helpline */}
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
              <PhoneCall className="w-3 h-3 text-emerald-700" />
              <span>{t.helplineTitle}: <strong className="text-emerald-950 font-mono font-black">{t.helplineNumber}</strong></span>
              <span className="hidden sm:inline text-[10px] text-emerald-700 font-normal">{t.helplineTiming}</span>
            </div>

            {/* Font Zoom Accessibility */}
            <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold">
              <button 
                onClick={() => handleFontResize('small')} 
                className={`px-1 rounded ${fontSize === 'small' ? 'bg-blue-950 text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                title="Decrease font size"
              >
                {t.fontSmall}
              </button>
              <button 
                onClick={() => handleFontResize('normal')} 
                className={`px-1 rounded ${fontSize === 'normal' ? 'bg-blue-950 text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                title="Normal font size"
              >
                {t.fontNormal}
              </button>
              <button 
                onClick={() => handleFontResize('large')} 
                className={`px-1 rounded ${fontSize === 'large' ? 'bg-blue-950 text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                title="Increase font size"
              >
                {t.fontLarge}
              </button>
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 font-extrabold text-blue-950 bg-amber-400 hover:bg-amber-300 border border-amber-600 px-2.5 py-0.5 rounded shadow-sm transition-colors text-[11px]"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.langToggle}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Ministry Branding Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between font-body">
        <Link href="/" className="flex items-center gap-3.5 group">
          {/* Ashoka Pillar / Ministry Emblem Badge */}
          <div className="w-11 h-11 rounded-full bg-blue-950 flex items-center justify-center text-amber-400 border border-amber-500 shadow-sm shrink-0">
            <Landmark className="w-5 h-5" />
          </div>

          <div>
            <div className="text-[11px] font-semibold text-orange-700 uppercase tracking-wide">
              {t.ministryName}
            </div>
            <div className="font-display text-lg sm:text-xl font-bold text-blue-950 leading-snug">
              {t.portalTitle}
            </div>
            <div className="text-[11px] text-slate-600 font-normal">
              {t.portalSubtitle}
            </div>
          </div>
        </Link>

        {/* Dynamic User Status Badge on Right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border ${
              isFarmer 
                ? 'bg-emerald-50 border-emerald-300' 
                : isStaff 
                ? 'bg-blue-50 border-blue-300' 
                : 'bg-amber-50 border-amber-300'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                isFarmer ? 'bg-emerald-700' : isStaff ? 'bg-blue-950' : 'bg-amber-600'
              }`}>
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-900 block leading-tight">
                  {user.name || user.username}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wider block ${
                  isFarmer ? 'text-emerald-800' : isStaff ? 'text-blue-900' : 'text-amber-800'
                }`}>
                  {isFarmer ? t.farmerRoleBadge : isStaff ? t.staffRoleBadge : t.adminRoleBadge}
                  {user.centreId?.code ? ` (${user.centreId.code})` : ''}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 px-2 py-1 rounded-md text-[11px] font-medium text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3 h-3" />
                <span>{t.logout}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-900 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>{t.liveSystemStatus}</span>
              </span>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 rounded-lg hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Official Blue Role-Adaptive Navigation Bar */}
      <div className="bg-blue-950 text-white border-t border-blue-900 px-4 sm:px-8 font-body">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-medium">
          {/* Dynamic Link Bar Based on Role */}
          <div className="hidden md:flex items-center divide-x divide-blue-900">
            {/* 1. GUEST NAVIGATION (Not Logged In) */}
            {!user && (
              <>
                <Link
                  href="/"
                  className={`px-4 py-2.5 transition-colors ${
                    pathname === '/' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  {t.navHome}
                </Link>
                <Link
                  href="/centres"
                  className={`px-4 py-2.5 transition-colors ${
                    pathname.startsWith('/centres') ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  {t.navMandis}
                </Link>
                <Link
                  href="/register"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/register' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-amber-300'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.navRegister}</span>
                </Link>
                <Link
                  href="/#guidelines"
                  className="px-4 py-2.5 transition-colors hover:bg-blue-900 text-blue-100 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-300" />
                  <span>{t.navGuidelines}</span>
                </Link>
              </>
            )}

            {/* 2. FARMER NAVIGATION */}
            {isFarmer && (
              <>
                <Link
                  href="/centres"
                  className={`px-4 py-2.5 transition-colors ${
                    pathname.startsWith('/centres') ? 'bg-emerald-700 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  {t.navFarmerCentres}
                </Link>
                <Link
                  href="/my-bookings"
                  className={`px-4 py-2.5 transition-colors ${
                    pathname === '/my-bookings' ? 'bg-emerald-700 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  {t.navFarmerBookings}
                </Link>
                <Link
                  href="/payments"
                  className={`px-4 py-2.5 transition-colors ${
                    pathname === '/payments' ? 'bg-emerald-700 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  {t.navFarmerPayments}
                </Link>
              </>
            )}

            {/* 3. STAFF NAVIGATION (Mandi Gate & Scale Desks) */}
            {isStaff && (
              <>
                <Link
                  href="/staff/today"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/staff/today' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t.navStaffArrivals}</span>
                </Link>
                <Link
                  href="/staff/queue"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/staff/queue' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{t.navStaffScale}</span>
                </Link>
                <Link
                  href="/staff/procurement"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/staff/procurement' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.navStaffProcurement}</span>
                </Link>
                <Link
                  href="/staff/payments"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/staff/payments' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t.navStaffDisbursement}</span>
                </Link>
              </>
            )}

            {/* 4. ADMIN NAVIGATION (HQ Control & Reports) */}
            {isAdmin && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin/dashboard' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{t.navAdminDashboard}</span>
                </Link>
                <Link
                  href="/admin/centres"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin/centres' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t.navAdminCentres}</span>
                </Link>
                <Link
                  href="/admin/staff"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin/staff' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{t.navAdminStaff}</span>
                </Link>
                <Link
                  href="/admin/slots"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin/slots' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>{t.navAdminSlots}</span>
                </Link>
                <Link
                  href="/admin/reports"
                  className={`px-4 py-2.5 transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin/reports' ? 'bg-amber-600 text-white' : 'hover:bg-blue-900 text-blue-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{t.navAdminReports}</span>
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center text-[11px] text-blue-200">
            <span>{t.sessionYear}</span>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-blue-900 space-y-1 text-sm font-semibold">
            {!user && (
              <>
                <Link href="/" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navHome}
                </Link>
                <Link href="/centres" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navMandis}
                </Link>
                <Link href="/register" className="block px-3 py-2 rounded hover:bg-blue-900 text-amber-300" onClick={() => setMobileMenuOpen(false)}>
                  {t.navRegister}
                </Link>
                <Link href="/#guidelines" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navGuidelines}
                </Link>
              </>
            )}

            {isFarmer && (
              <>
                <Link href="/centres" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navFarmerCentres}
                </Link>
                <Link href="/my-bookings" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navFarmerBookings}
                </Link>
                <Link href="/payments" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navFarmerPayments}
                </Link>
              </>
            )}

            {isStaff && (
              <>
                <Link href="/staff/today" className="block px-3 py-2 rounded hover:bg-blue-900 text-amber-300" onClick={() => setMobileMenuOpen(false)}>
                  {t.navStaffArrivals}
                </Link>
                <Link href="/staff/queue" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navStaffScale}
                </Link>
                <Link href="/staff/procurement" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navStaffProcurement}
                </Link>
                <Link href="/staff/payments" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navStaffDisbursement}
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link href="/admin/dashboard" className="block px-3 py-2 rounded hover:bg-blue-900 text-amber-300" onClick={() => setMobileMenuOpen(false)}>
                  {t.navAdminDashboard}
                </Link>
                <Link href="/admin/centres" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navAdminCentres}
                </Link>
                <Link href="/admin/staff" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navAdminStaff}
                </Link>
                <Link href="/admin/slots" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navAdminSlots}
                </Link>
                <Link href="/admin/reports" className="block px-3 py-2 rounded hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>
                  {t.navAdminReports}
                </Link>
              </>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-rose-300 hover:bg-blue-900 flex items-center gap-2 mt-2 border-t border-blue-900"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
