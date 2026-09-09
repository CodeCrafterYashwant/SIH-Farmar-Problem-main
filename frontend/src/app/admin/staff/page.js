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
  ShieldCheck, 
  KeyRound,
  Trash2,
  X,
  Building2,
  UserCheck,
  Calendar
} from 'lucide-react';

export default function AdminStaffPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [centres, setCentres] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff',
    centreId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Deletion Modal State
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    setCurrentUser(parsed);

    fetchCentres();
    fetchStaff();

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang] || translations.hi;

  const fetchCentres = async () => {
    try {
      const res = await apiRequest('/api/centres');
      if (res.centres) {
        setCentres(res.centres);
        if (res.centres.length > 0) {
          setFormData((prev) => ({ ...prev, centreId: res.centres[0]._id }));
        }
      }
    } catch (err) {
      console.error('Fetch centres error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await apiRequest('/api/staff');
      if (res.staff) {
        setStaffList(res.staff);
      }
    } catch (err) {
      console.error('Fetch staff error:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        name: formData.name,
        username: formData.username.toLowerCase(),
        password: formData.password,
        role: formData.role,
        centreId: formData.role === 'staff' ? formData.centreId : undefined,
      };

      const res = await apiRequest('/api/staff', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setMessage(lang === 'hi'
          ? `मंडी स्टाफ खाता '${res.staff.name}' (${res.staff.username}) सफलतापूर्वक सृजित!`
          : `Staff account '${res.staff.name}' (${res.staff.username}) provisioned successfully!`);
        setFormData({
          name: '',
          username: '',
          password: '',
          role: 'staff',
          centreId: centres[0]?._id || '',
        });
        fetchStaff();
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'स्टाफ खाता बनाने में विफल' : 'Failed to provision staff account'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    setDeleteLoading(true);
    try {
      const res = await apiRequest(`/api/staff/${deletingStaff._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setMessage(lang === 'hi'
          ? `स्टाफ खाता '${deletingStaff.name}' (${deletingStaff.username}) सफलतापूर्वक हटाया गया।`
          : `Staff account '${deletingStaff.name}' (${deletingStaff.username}) deleted successfully.`);
        setDeletingStaff(null);
        fetchStaff();
      }
    } catch (err) {
      setError(err.message || (lang === 'hi' ? 'स्टाफ खाता हटाने में विफल' : 'Failed to delete staff account'));
    } finally {
      setDeleteLoading(false);
    }
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
              {t.adminStaffHeading}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {t.adminStaffSub}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>{t.adminRoleBadge}</span>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-2.5 text-emerald-900 text-xs font-semibold">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
              <span>{message}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2.5 text-rose-800 text-xs font-semibold">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Create Staff Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold block mb-0.5">{t.staffNoticeHeading}</span>
                {t.staffDisclaimer}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3.5">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>{t.provisionStaffBtn}</span>
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.officerNameLabel} *</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'hi' ? 'उदा. रमेश कुमार शर्मा' : 'e.g. Ramesh Kumar Sharma'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.officerUsernameLabel} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh_sehore"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data font-semibold text-slate-900 lowercase focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.officerPasswordLabel} *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={lang === 'hi' ? 'कम से कम 6 अक्षर' : 'At least 6 characters'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-data text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.officerRoleLabel} *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="staff">{lang === 'hi' ? 'उपार्जन स्टाफ (गेट सत्यापन व तौल कांटा ऑपरेटर)' : 'Mandi Staff (Gate & Weighbridge Desk)'}</option>
                  <option value="admin">{lang === 'hi' ? 'जिला/राज्य प्रशासक (Admin Control)' : 'District/State Admin (HQ Control)'}</option>
                </select>
              </div>

              {formData.role === 'staff' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.assignedMandiLabel} *</label>
                  <select
                    value={formData.centreId}
                    onChange={(e) => setFormData({ ...formData, centreId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    {centres.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.code} - {t.districtLabel}: {c.district})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors shadow-sm active:scale-95 disabled:opacity-50 mt-2"
              >
                {submitting ? (lang === 'hi' ? 'खाता बनाया जा रहा है...' : 'Provisioning...') : `✓ ${t.provisionStaffBtn}`}
              </button>
            </form>
          </div>

          {/* Right Column: Active Staff Accounts List */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>{t.activeStaffListTitle} ({staffList.length})</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                {lang === 'hi' ? 'गेट व तौल ऑपरेटर' : 'Gate & Weigh Operators'}
              </span>
            </h2>

            {staffLoading ? (
              <div className="py-16 text-center text-slate-500 text-xs font-medium">
                {lang === 'hi' ? 'स्टाफ खाते लोड हो रहे हैं...' : 'Loading staff accounts...'}
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                {t.noStaffMsg}
              </div>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {staffList.map((st) => {
                  const isSelf = currentUser && (currentUser.id === st._id || currentUser._id === st._id || currentUser.username === st.username);

                  return (
                    <div
                      key={st._id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs interactive-card transition-all hover:border-slate-300"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{st.name}</span>
                          <span className="font-data text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                            @{st.username}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              st.role === 'admin'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {st.role === 'admin' ? 'Admin' : 'Mandi Staff'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 text-[11px]">
                          {st.centreId ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {st.centreId.name} ({st.centreId.code}) - {st.centreId.district}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              {st.role === 'admin' ? (lang === 'hi' ? 'मुख्यालय / राज्य स्तर' : 'State / HQ Level') : (lang === 'hi' ? 'कोई मंडी आवंटित नहीं' : 'No centre assigned')}
                            </span>
                          )}

                          {st.createdAt && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(st.createdAt).toLocaleDateString('en-IN')}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {isSelf ? (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600">
                            {lang === 'hi' ? 'वर्तमान खाता' : 'Current Account'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingStaff(st)}
                            title={t.deleteStaffBtn}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-medium text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t.deleteStaffBtn}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Staff Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'hi' ? 'स्टाफ खाता हटाएं?' : 'Delete Staff Account?'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-2 leading-relaxed">
              {t.confirmDeleteStaff}
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-5 space-y-1">
              <p className="font-semibold text-slate-900">{deletingStaff.name}</p>
              <p className="text-slate-500 font-data text-[11px]">
                Username: @{deletingStaff.username} | Role: {deletingStaff.role}
              </p>
              {deletingStaff.centreId && (
                <p className="text-slate-500 text-[11px]">
                  Mandi: {deletingStaff.centreId.name} ({deletingStaff.centreId.code})
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteStaff}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {deleteLoading ? (lang === 'hi' ? 'हटाया जा रहा है...' : 'Deleting...') : t.deleteStaffBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
