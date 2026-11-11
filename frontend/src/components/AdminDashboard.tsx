import React, { useState, useEffect } from 'react';
import {
  School,
  Clock,
  Layers,
  PlusCircle,
  LogOut,
  Users,
  CheckCircle,
  Ticket,
  RefreshCw,
  Home
} from 'lucide-react';
import { api } from '../api/client';
import { SchoolClass, AcademicClass, AcademicShift } from '../api/types';

interface Props {
  adminUsername: string;
  onLogout: () => void;
  onGoToHome: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  adminUsername,
  onLogout,
  onGoToHome,
  onSuccess,
  onError
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'classes' | 'shifts'>('sessions');

  const [classesCatalog, setClassesCatalog] = useState<AcademicClass[]>([]);
  const [shifts, setShifts] = useState<AcademicShift[]>([]);
  const [sessions, setSessions] = useState<SchoolClass[]>([]);

  const [loading, setLoading] = useState(false);

  // Form states for creating a session
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [sessionSeats, setSessionSeats] = useState<number | ''>(120);

  // Form states for adding class/shift
  const [newClassName, setNewClassName] = useState('');
  const [newShiftName, setNewShiftName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [clsList, shfList, sessList] = await Promise.all([
        api.getAcademicClasses(),
        api.getAcademicShifts(),
        api.getClasses()
      ]);
      setClassesCatalog(clsList);
      setShifts(shfList);
      setSessions(sessList);

      if (clsList.length > 0 && !selectedClassId) setSelectedClassId(clsList[0].id);
      if (shfList.length > 0 && !selectedShiftId) setSelectedShiftId(shfList[0].id);
    } catch (err: any) {
      onError(err.message || 'ডাটা লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedShiftId || !sessionSeats || Number(sessionSeats) <= 0) {
      onError('শ্রেণি, শিফট এবং সঠিক আসন সংখ্যা নির্বাচন করুন।');
      return;
    }

    try {
      const res = await api.createSession({
        classLevelId: selectedClassId,
        shiftId: selectedShiftId,
        totalSeats: Number(sessionSeats)
      });
      onSuccess(`সেশন "${res.name}" সফলভাবে তৈরি হয়েছে (${res.totalSeats} আসন)`);
      loadData();
    } catch (err: any) {
      onError(err.message || 'সেশন তৈরি করতে ব্যর্থ হয়েছে');
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      onError('শ্রেণির নাম লিখুন।');
      return;
    }

    try {
      const res = await api.createAcademicClass(newClassName.trim());
      onSuccess(`নতুন শ্রেণি "${res.name}" যুক্ত হয়েছে।`);
      setNewClassName('');
      loadData();
    } catch (err: any) {
      onError(err.message || 'শ্রেণি তৈরি করতে ব্যর্থ হয়েছে');
    }
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim()) {
      onError('শিফটের নাম লিখুন।');
      return;
    }

    try {
      const res = await api.createAcademicShift(newShiftName.trim());
      onSuccess(`নতুন শিফট "${res.name}" যুক্ত হয়েছে।`);
      setNewShiftName('');
      loadData();
    } catch (err: any) {
      onError(err.message || 'শিফট তৈরি করতে ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              অ
            </div>
            <div>
              <span className="font-bold text-base block leading-tight">বিদ্যালয় প্রশাসক প্যানেল</span>
              <span className="text-[11px] text-slate-400">Admin Control Center ({adminUsername})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGoToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Home className="w-3.5 h-3.5" /> শিক্ষার্থী ভিউ (Student View)
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 transition-colors border border-rose-800/40"
            >
              <LogOut className="w-3.5 h-3.5" /> লগআউট (Logout)
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-colors ${
                activeTab === 'sessions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              সেশন ও আসন তৈরি (Create Session)
            </button>

            <button
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-colors ${
                activeTab === 'classes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <School className="w-4 h-4" />
              শ্রেণি তালিকা (Class Table)
            </button>

            <button
              onClick={() => setActiveTab('shifts')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-colors ${
                activeTab === 'shifts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              শিফট তালিকা (Shift Table)
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tab 1: Create Session (Class + Shift + Total Seats) */}
        {activeTab === 'sessions' && (
          <div className="space-y-8">
            {/* Create Session Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  নতুন ভর্তি সেশন তৈরি করুন (Class + Shift + Seats)
                </h3>
              </div>

              <form onSubmit={handleCreateSession} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    শ্রেণি নির্বাচন করুন (Select Class)
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  >
                    {classesCatalog.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    শিফট নির্বাচন করুন (Select Shift)
                  </label>
                  <select
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    মোট শিক্ষার্থী আসন (Total Seats)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sessionSeats}
                    onChange={(e) => setSessionSeats(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    সেশন প্রকাশ করুন
                  </button>
                </div>
              </form>
            </div>

            {/* Live Active Sessions Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">চালু সেশন ও লাইভ আসন পরিস্থিতি</h3>
                  <p className="text-xs text-gray-500">Active admission sessions with real-time seat tracking</p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                  মোট সেশন: {sessions.length}টি
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">সেশনের নাম (Class & Shift)</th>
                      <th className="px-6 py-3">মোট আসন</th>
                      <th className="px-6 py-3">ভর্তি নিশ্চিত</th>
                      <th className="px-6 py-3">হোল্ডে আছে</th>
                      <th className="px-6 py-3">খালি আসন</th>
                      <th className="px-6 py-3">অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {sessions.map((s) => {
                      const isFull = s.availableSeats <= 0;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                          <td className="px-6 py-4 text-gray-600">{s.totalSeats}</td>
                          <td className="px-6 py-4 text-emerald-600 font-semibold">{s.confirmedSeats}</td>
                          <td className="px-6 py-4 text-amber-600 font-semibold">{s.heldSeats}</td>
                          <td className="px-6 py-4 text-indigo-600 font-bold">{s.availableSeats}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                isFull ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isFull ? 'পূর্ণ (Full)' : 'আবেদন চালু'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Class Table */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 text-base mb-3">নতুন শ্রেণি যোগ করুন (Add Academic Class)</h3>
              <form onSubmit={handleAddClass} className="flex gap-3">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Class 11"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-sm transition-colors"
                >
                  যোগ করুন
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">শ্রেণি তালিকা (Class Table)</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">আইডি (ID)</th>
                    <th className="px-6 py-3">শ্রেণির নাম (Class Name)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classesCatalog.map((c) => (
                    <tr key={c.id}>
                      <td className="px-6 py-3 font-mono text-xs text-gray-400">{c.id}</td>
                      <td className="px-6 py-3 font-bold text-gray-800">{c.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Shift Table */}
        {activeTab === 'shifts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 text-base mb-3">নতুন শিফট যোগ করুন (Add Shift)</h3>
              <form onSubmit={handleAddShift} className="flex gap-3">
                <input
                  type="text"
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  placeholder="e.g. Evening Shift"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-sm transition-colors"
                >
                  যোগ করুন
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">শিফট তালিকা (Shift Table)</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">আইডি (ID)</th>
                    <th className="px-6 py-3">শিফটের নাম (Shift Name)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shifts.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-3 font-mono text-xs text-gray-400">{s.id}</td>
                      <td className="px-6 py-3 font-bold text-gray-800">{s.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
